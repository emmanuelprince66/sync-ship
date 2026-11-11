import Papa from 'papaparse'
import type { ImportItemRow } from '@/api/items'

/**
 * Item import sheets (.xlsx or .csv), modelled on sink-inventory's product upload:
 * snake_case columns, a downloadable template in both formats, and every row
 * validated before anything is sent. Columns are the virtual-product fields.
 */

export const IMPORT_MAX_BYTES = 5 * 1024 * 1024
export const IMPORT_MAX_ROWS = 500
export const IMPORT_ACCEPT = '.xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv'

export const TEMPLATE_COLUMNS = ['name', 'description', 'selling_price', 'weight', 'availability', 'listed_on_storefront', 'sku'] as const
type Column = (typeof TEMPLATE_COLUMNS)[number]

/** Header spellings we accept for each column (after lower-casing and turning spaces/symbols into _). */
const ALIASES: Record<Column, string[]> = {
  name: ['name', 'item_name', 'product_name', 'item'],
  description: ['description', 'details'],
  selling_price: ['selling_price', 'price', 'amount', 'selling_price_ngn', 'price_ngn'],
  weight: ['weight', 'weight_kg', 'kg'],
  availability: ['availability', 'available', 'in_stock'],
  listed_on_storefront: ['listed_on_storefront', 'listed', 'on_storefront', 'show_on_storefront', 'storefront'],
  sku: ['sku', 'barcode', 'sku_barcode'],
}

const TEMPLATE_ROWS: Record<Column, string | number>[] = [
  { name: 'Classic leather handbag', description: 'Full-grain leather with brass hardware', selling_price: 48000, weight: 2.5, availability: 'Yes', listed_on_storefront: 'Yes', sku: '' },
  { name: 'Ivory mini bag', description: '', selling_price: 32500, weight: 1.2, availability: 'Yes', listed_on_storefront: 'No', sku: '' },
  { name: 'Peak Full Cream Milk Tin 400g', description: '', selling_price: '', weight: 0.4, availability: 'Yes', listed_on_storefront: 'Yes', sku: '6154000056789' },
]

/** A parsed sheet row: what will be sent, plus why it can't be (empty `errors` = ready). */
export type SheetRow = ImportItemRow & { line: number; errors: string[] }
export type ParsedSheet = { rows: SheetRow[]; fileError: string | null }

/** trim() also drops the byte-order mark Excel puts before the first CSV header. */
const normalizeHeader = (header: string) => header.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

const cell = (value: unknown) => (value === undefined || value === null ? '' : String(value).trim())

/** "₦12,500", "NGN 12500", "12 500" → "12500"; null when it isn't a number ≥ 0. */
const parseAmount = (value: string): string | null => {
  const cleaned = value.replace(/ngn|₦|naira|kg/gi, '').replace(/[,\s]/g, '')
  if (!cleaned) return ''
  const amount = Number(cleaned)
  return Number.isFinite(amount) && amount >= 0 ? String(amount) : null
}

const YES = ['yes', 'y', 'true', '1', 'available', 'in stock', 'instock', 'listed', 'on', 'show', 'visible']
const NO = ['no', 'n', 'false', '0', 'unavailable', 'not available', 'out of stock', 'outofstock', 'hidden', 'off', 'hide', 'unlisted']
/** Blank → the default; otherwise Yes/No in the usual spellings. null when unreadable. */
const parseYesNo = (value: string, fallback: boolean): boolean | null => {
  const text = value.toLowerCase().replace(/\s+/g, ' ')
  if (!text) return fallback
  if (YES.includes(text)) return true
  if (NO.includes(text)) return false
  return null
}

const readCsv = (file: File) => new Promise<Record<string, unknown>[]>((resolve, reject) => {
  Papa.parse<Record<string, unknown>>(file, { header: true, skipEmptyLines: 'greedy', complete: ({ data }) => resolve(data), error: reject })
})

const readWorkbook = async (file: File) => {
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!sheet) return []
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: false, defval: '' })
}

const isSpreadsheet = (name: string) => /\.(xlsx|xls)$/i.test(name)
const isCsv = (name: string) => /\.csv$/i.test(name)

/** Reads and validates an item sheet. Never throws: problems come back as fileError or per-row errors. */
export async function parseItemSheet(file: File): Promise<ParsedSheet> {
  if (!isSpreadsheet(file.name) && !isCsv(file.name)) return { rows: [], fileError: 'Choose an Excel (.xlsx) or CSV file.' }
  if (file.size > IMPORT_MAX_BYTES) return { rows: [], fileError: 'That file is larger than 5 MB.' }
  let records: Record<string, unknown>[]
  try {
    records = isCsv(file.name) ? await readCsv(file) : await readWorkbook(file)
  } catch {
    return { rows: [], fileError: 'We couldn’t read that file. Save it again as .xlsx or .csv and retry.' }
  }

  const headers = Object.keys(records[0] ?? {})
  const columnOf = (column: Column) => headers.find(header => ALIASES[column].includes(normalizeHeader(header)))
  const columns = Object.fromEntries(TEMPLATE_COLUMNS.map(column => [column, columnOf(column)])) as Record<Column, string | undefined>
  if (!records.length) return { rows: [], fileError: 'The sheet has no rows. Add your items under the header row.' }
  const missing = [!columns.name && 'name', !columns.selling_price && !columns.sku && 'selling_price'].filter(Boolean)
  if (missing.length) return { rows: [], fileError: `Missing column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}. Use the template’s header row.` }

  const rows = records
    .map((record, index) => {
      const value = (column: Column) => (columns[column] ? cell(record[columns[column]]) : '')
      const errors: string[] = []
      const name = value('name')
      const sku = value('sku')
      if (!name) errors.push('Name is missing')
      else if (name.length > 255) errors.push('Name is longer than 255 characters')
      const price = parseAmount(value('selling_price'))
      if (price === null) errors.push('Selling price must be a number')
      else if (!price && !sku) errors.push('Selling price is missing')
      const weight = parseAmount(value('weight'))
      if (weight === null) errors.push('Weight must be a number in kg')
      const available = parseYesNo(value('availability'), true)
      if (available === null) errors.push('Availability must be Yes or No')
      const listed = parseYesNo(value('listed_on_storefront'), true)
      if (listed === null) errors.push('Listed on storefront must be Yes or No')
      const blank = TEMPLATE_COLUMNS.every(column => !value(column))
      // Line numbers as the spreadsheet shows them (row 1 is the header).
      return blank ? null : { line: index + 2, name, description: value('description'), price: price ?? '', weight: weight ?? '', available: available ?? true, listed: listed ?? true, sku, errors }
    })
    .filter((row): row is SheetRow => row !== null)

  if (!rows.length) return { rows: [], fileError: 'The sheet has no rows. Add your items under the header row.' }
  if (rows.length > IMPORT_MAX_ROWS) return { rows: [], fileError: `Import up to ${IMPORT_MAX_ROWS} items at a time. Split the sheet and try again.` }
  return { rows, fileError: null }
}

const saveBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** The import template as .xlsx (default) or .csv, with the same columns and sample rows. */
export async function downloadItemTemplate(format: 'xlsx' | 'csv') {
  if (format === 'csv') {
    const csv = Papa.unparse({ fields: [...TEMPLATE_COLUMNS], data: TEMPLATE_ROWS.map(row => TEMPLATE_COLUMNS.map(column => row[column])) })
    saveBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'syncship-items-template.csv')
    return
  }
  const XLSX = await import('xlsx')
  const sheet = XLSX.utils.json_to_sheet(TEMPLATE_ROWS, { header: [...TEMPLATE_COLUMNS] })
  sheet['!cols'] = TEMPLATE_COLUMNS.map(column => ({ wch: column === 'name' || column === 'description' ? 32 : 20 }))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Items')
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
  saveBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'syncship-items-template.xlsx')
}
