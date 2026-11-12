import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { FilePicker } from '@/components/ui/common'
import { Modal, ModalHeader } from '@/components/ui/Modal'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { formatNaira } from '@/lib/format'
import { useImportItems, type ImportFailure } from './hooks/useImportItems'
import { IMPORT_ACCEPT, IMPORT_MAX_ROWS, type SheetRow } from './lib/itemSheet'

type ImportFlow = ReturnType<typeof useImportItems>

const yesNo = (value: boolean) => (value ? 'Yes' : 'No')

function PickFile({ flow }: { flow: ImportFlow }) {
  const reading = flow.stage === 'reading'
  return <div className="flex flex-col gap-4">
    <div className="rounded-2xl bg-[#F1F7F1] p-4 text-[11px] leading-5 text-[#60766A]">
      <strong className="text-[#315A3E]">Columns:</strong> <code>name</code> and <code>selling_price</code> are required. Optional: <code>description</code>, <code>weight</code> (kg), <code>availability</code> and <code>listed_on_storefront</code> (Yes/No, blank = Yes), and <code>sku</code> — saved on the item; a SKU or barcode also fills a missing price or description and adds the product’s picture when we find it. Up to {IMPORT_MAX_ROWS} rows.
    </div>
    <FilePicker accept={IMPORT_ACCEPT} onFile={flow.pickFile} className={cn('flex flex-col items-center rounded-2xl border-2 border-dashed border-[#C9D8CF] p-8 text-center transition hover:border-[#529661]', reading && 'pointer-events-none opacity-70')}>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF5E9] text-[#438352]">{reading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"/> : <Icon name="download" size={21}/>}</div>
      <div className="mt-3 text-xs font-extrabold text-[#28483B]">{reading ? `Reading ${flow.fileName}…` : 'Choose an Excel or CSV file'}</div>
      <div className="mt-1 text-[10px] text-[#87968F]">.xlsx, .xls or .csv · up to 5 MB</div>
    </FilePicker>
    {flow.fileError && <div role="alert" className="flex items-start gap-2 rounded-xl bg-[#FFF3F1] p-3 text-[11px] leading-5 text-[#A63E33]"><Icon name="close" size={15}/><span><strong>{flow.fileName}:</strong> {flow.fileError}</span></div>}
    <div className="grid grid-cols-2 gap-2">
      <Button variant="outline" icon="download" onClick={() => flow.downloadTemplate('xlsx')} className="text-xs">Excel template</Button>
      <Button variant="outline" icon="download" onClick={() => flow.downloadTemplate('csv')} className="text-xs">CSV template</Button>
    </div>
  </div>
}

function PreviewRow({ row }: { row: SheetRow }) {
  const bad = row.errors.length > 0
  return <li className={cn('rounded-xl border p-3', bad ? 'border-[#F2C9C3] bg-[#FFF8F6]' : 'border-[#E2EAE5] bg-white')}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[10px] font-bold text-[#8A9891]">Row {row.line}{row.sku ? ` · SKU ${row.sku}` : ''}</div>
        <div className="truncate text-xs font-extrabold text-[#28483B]">{row.name || <span className="text-[#C2483D]">No name</span>}</div>
        {row.description && <div className="truncate text-[10px] text-[#899890]">{row.description}</div>}
      </div>
      <div className="shrink-0 text-right">
        <div className="text-xs font-black text-[#17382C]">{row.price ? formatNaira(row.price) : row.sku ? 'From SKU' : '—'}</div>
        <div className="text-[10px] text-[#829189]">{row.weight ? `${row.weight} kg` : 'Default weight'}</div>
      </div>
    </div>
    <div className="mt-2 flex flex-wrap gap-1.5 text-[9px] font-extrabold">
      <span className={cn('rounded-full px-2 py-0.5', row.available ? 'bg-[#EAF5E9] text-[#438352]' : 'bg-[#EEF1EF] text-[#5F7168]')}>Available: {yesNo(row.available)}</span>
      <span className={cn('rounded-full px-2 py-0.5', row.listed ? 'bg-[#EAF5E9] text-[#438352]' : 'bg-[#EEF1EF] text-[#5F7168]')}>On storefront: {yesNo(row.listed)}</span>
    </div>
    {bad && <ul className="mt-2 space-y-0.5 text-[10px] font-semibold text-[#B2453A]">{row.errors.map(error => <li key={error}>• {error}</li>)}</ul>}
  </li>
}

function Preview({ flow }: { flow: ImportFlow }) {
  return <div className="flex flex-col gap-3">
    <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
      <span className="rounded-full bg-[#F3F7F4] px-3 py-1 text-[#34483F]">{flow.fileName}</span>
      <span className="rounded-full bg-[#EAF5E9] px-3 py-1 text-[#438352]">{flow.validCount} ready</span>
      {flow.invalidCount > 0 && <span className="rounded-full bg-[#FFF0EE] px-3 py-1 text-[#B2453A]">{flow.invalidCount} with problems</span>}
    </div>
    {flow.invalidCount > 0 && <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#FFF8E8] p-3 text-[11px] leading-5 text-[#80662B]">
      <span>Rows with problems are skipped. Fix them in your sheet and import it again, or import the {flow.validCount} ready row{flow.validCount === 1 ? '' : 's'} now.</span>
      <label className="flex items-center gap-1.5 font-extrabold"><input type="checkbox" checked={flow.showOnlyProblems} onChange={event => flow.setShowOnlyProblems(event.target.checked)} className="accent-[#529661]"/>Only problems</label>
    </div>}
    <ul className="flex flex-col gap-2" aria-label="Rows to import">{flow.previewRows.map(row => <PreviewRow key={row.line} row={row}/>)}</ul>
    {flow.hiddenPreviewCount > 0 && <Button variant="ghost" onClick={flow.showMorePreview} className="text-xs">Show {Math.min(flow.hiddenPreviewCount, 50)} more of {flow.hiddenPreviewCount}</Button>}
  </div>
}

function Progress({ flow }: { flow: ImportFlow }) {
  const percent = flow.progressTotal ? Math.round((flow.progress / flow.progressTotal) * 100) : 0
  return <div className="py-6">
    <div className="flex items-center justify-between text-xs font-extrabold text-[#28483B]"><span>Importing items…</span><span>{flow.progress} of {flow.progressTotal}</span></div>
    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#EAF1EC]" role="progressbar" aria-valuemin={0} aria-valuemax={flow.progressTotal} aria-valuenow={flow.progress} aria-label="Import progress"><div className="h-full rounded-full bg-[#529661] transition-all" style={{ width: `${percent}%` }}/></div>
    <p className="mt-3 text-[11px] text-[#7C8D85]">Keep this window open until it finishes.</p>
    <SkeletonGroup label="Importing" className="mt-5 flex flex-col gap-2">{[0, 1, 2].map(index => <Skeleton key={index} className="h-12 rounded-xl"/>)}</SkeletonGroup>
  </div>
}

function FailureList({ failures }: { failures: ImportFailure[] }) {
  return <ul className="mt-3 flex flex-col gap-2" aria-label="Rows not imported">
    {failures.map(failure => <li key={failure.line} className="rounded-xl border border-[#F2C9C3] bg-[#FFF8F6] p-3">
      <div className="text-[10px] font-bold text-[#8A9891]">Row {failure.line}</div>
      <div className="truncate text-xs font-extrabold text-[#28483B]">{failure.name}</div>
      <div className="mt-0.5 text-[10px] font-semibold leading-4 text-[#B2453A]">{failure.reason}</div>
    </li>)}
  </ul>
}

function Summary({ flow }: { flow: ImportFlow }) {
  const allGood = flow.failures.length === 0
  return <div>
    <div className="flex items-center gap-3 rounded-2xl bg-[#F1F7F1] p-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#438352]"><Icon name="check" size={20}/></div>
      <div>
        <div className="text-sm font-black text-[#17382C]">{flow.importedCount} item{flow.importedCount === 1 ? '' : 's'} imported</div>
        <div className="text-[11px] text-[#60766A]">{allGood ? 'Everything in the sheet is now in your item list.' : `${flow.failures.length} row${flow.failures.length === 1 ? '' : 's'} not imported — see why below.`}</div>
      </div>
    </div>
    {!allGood && <FailureList failures={flow.failures}/>}
  </div>
}

export function ImportItemsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const flow = useImportItems(onClose)
  const busy = flow.stage === 'importing'

  return <Modal open={open} onClose={flow.close} overlayClassName="bg-[#09261C]/40 p-0 backdrop-blur-[2px] sm:p-4" panelClassName="flex h-[100dvh] w-full flex-col bg-white shadow-[0_25px_80px_rgba(9,38,28,.2)] sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:max-w-xl sm:rounded-3xl">
    <ModalHeader title="Import items" description="Add many items at once from an Excel or CSV sheet." onClose={busy ? undefined : flow.close} closeButton={busy ? 'none' : 'bordered'} className="shrink-0 border-b border-[#EDF1EF] px-5 py-4 sm:px-6"/>
    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
      {(flow.stage === 'pick' || flow.stage === 'reading') && <PickFile flow={flow}/>}
      {flow.stage === 'preview' && <Preview flow={flow}/>}
      {flow.stage === 'importing' && <Progress flow={flow}/>}
      {flow.stage === 'done' && <Summary flow={flow}/>}
    </div>
    {(flow.stage === 'preview' || flow.stage === 'done') && <div className="flex shrink-0 justify-end gap-2 border-t border-[#EDF1EF] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 [&>button]:flex-1 sm:[&>button]:flex-none">
      {flow.stage === 'preview'
        ? <><Button variant="ghost" onClick={flow.reset}>Choose another file</Button><Button onClick={flow.startImport} disabled={flow.validCount === 0}>{flow.validCount === 0 ? 'Nothing to import' : `Import ${flow.validCount} item${flow.validCount === 1 ? '' : 's'}`}</Button></>
        : <><Button variant="ghost" onClick={flow.reset}>Import another file</Button><Button onClick={flow.close}>Done</Button></>}
    </div>}
  </Modal>
}
