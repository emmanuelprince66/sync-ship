import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { FilePicker } from '@/components/ui/common'
import { Modal, ModalHeader } from '@/components/ui/Modal'
import { useImportItems } from './hooks/useImportItems'

export function ImportItemsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { importSheet, isImporting, downloadTemplate } = useImportItems(onClose)

  return <Modal open={open} onClose={onClose} panelClassName="w-full max-w-lg rounded-3xl bg-white p-7">
    <ModalHeader title="Import items from Excel" description="Add many products to your account at once." onClose={onClose} closeButton="plain"/>
    <div className="mt-6 rounded-2xl bg-[#F1F7F1] p-4 text-[10px] leading-5 text-[#60766A]"><strong className="text-[#315A3E]">Required columns:</strong> Item name, weight (kg), selling price, and stock status. Product images can be added after import.</div>
    <FilePicker accept=".csv,text/csv" onFile={importSheet} className="mt-5 flex flex-col items-center rounded-2xl border-2 border-dashed border-[#C9D8CF] p-9 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF5E9] text-[#438352]">{isImporting ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"/> : <Icon name="download" size={21}/>}</div>
      <div className="mt-3 text-xs font-extrabold text-[#28483B]">Choose Excel or CSV file</div>
      <div className="mt-1 text-[10px] text-[#87968F]">Save Excel sheets as .csv · up to 5 MB</div>
    </FilePicker>
    <Button variant="ghost" icon="download" onClick={downloadTemplate} className="mt-4 w-full">Download import template</Button>
  </Modal>
}
