import { useState } from 'react'
import { toast } from 'sonner'
import { useImportItemRows } from '@/api/items'
import { downloadItemTemplate, parseItemSheet, type SheetRow } from '../lib/itemSheet'

export type ImportStage = 'pick' | 'reading' | 'preview' | 'importing' | 'done'
export type ImportFailure = { line: number; name: string; reason: string }

const PREVIEW_PAGE = 50

/**
 * Item import flow: pick an .xlsx/.csv → preview every row with its problems →
 * import the valid rows with progress → summary of what went in and what didn't.
 */
export function useImportItems(onClose: () => void) {
  const importRows = useImportItemRows()
  const [stage, setStage] = useState<ImportStage>('pick')
  const [fileName, setFileName] = useState('')
  const [fileError, setFileError] = useState<string | null>(null)
  const [rows, setRows] = useState<SheetRow[]>([])
  const [showOnlyProblems, setShowOnlyProblems] = useState(false)
  const [previewLimit, setPreviewLimit] = useState(PREVIEW_PAGE)
  const [progress, setProgress] = useState(0)
  const [imported, setImported] = useState(0)
  const [failures, setFailures] = useState<ImportFailure[]>([])

  const validRows = rows.filter(row => row.errors.length === 0)
  const invalidRows = rows.filter(row => row.errors.length > 0)
  const listed = showOnlyProblems ? invalidRows : rows

  const reset = () => {
    setStage('pick'); setFileName(''); setFileError(null); setRows([]); setShowOnlyProblems(false)
    setPreviewLimit(PREVIEW_PAGE); setProgress(0); setImported(0); setFailures([])
  }

  const pickFile = async (file: File) => {
    if (stage === 'reading' || stage === 'importing') return
    setStage('reading'); setFileName(file.name); setFileError(null)
    const parsed = await parseItemSheet(file)
    setRows(parsed.rows)
    setFileError(parsed.fileError)
    setShowOnlyProblems(false)
    setPreviewLimit(PREVIEW_PAGE)
    setStage(parsed.fileError ? 'pick' : 'preview')
  }

  const startImport = async () => {
    if (!validRows.length || stage === 'importing') return
    const queue = validRows
    setStage('importing'); setProgress(0)
    const results = await importRows(queue.map(({ name, description, price, weight, available, listed: onStore, sku }) => ({ name, description, price, weight, available, listed: onStore, sku })), setProgress)
    const failed = results.flatMap((result, index) => (result.ok ? [] : [{ line: queue[index].line, name: queue[index].name, reason: result.reason }]))
    setImported(results.length - failed.length)
    setFailures([...failed, ...invalidRows.map(row => ({ line: row.line, name: row.name || '(no name)', reason: row.errors.join(' · ') }))].sort((a, b) => a.line - b.line))
    setStage('done')
    if (failed.length === 0 && invalidRows.length === 0) toast.success(`${results.length} item${results.length === 1 ? '' : 's'} imported`)
  }

  const downloadTemplate = (format: 'xlsx' | 'csv') => {
    downloadItemTemplate(format).catch(() => toast.error('Could not create the template. Please try again.'))
  }

  return {
    stage,
    fileName,
    fileError,
    pickFile,
    reset,
    totalRows: rows.length,
    validCount: validRows.length,
    invalidCount: invalidRows.length,
    previewRows: listed.slice(0, previewLimit),
    hiddenPreviewCount: Math.max(listed.length - previewLimit, 0),
    showMorePreview: () => setPreviewLimit(limit => limit + PREVIEW_PAGE),
    showOnlyProblems,
    setShowOnlyProblems,
    startImport,
    progress,
    progressTotal: validRows.length,
    importedCount: imported,
    failures,
    downloadTemplate,
    /** Closing mid-import is blocked so the summary isn't lost; otherwise the next open starts fresh. */
    close: () => {
      if (stage === 'importing') return
      reset()
      onClose()
    },
  }
}
