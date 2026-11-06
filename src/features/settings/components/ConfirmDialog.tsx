import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { IconTile } from '@/components/ui/common'
import { Modal, ModalFooter, ModalTitle } from '@/components/ui/Modal'

/** Small "are you sure?" dialog in the design's modal style. */
export function ConfirmDialog({ open, title, description, confirmLabel, tone = 'danger', loading, onConfirm, onClose }: {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel: string
  tone?: 'danger' | 'default'
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return <Modal open={open} onClose={onClose} panelClassName="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7">
    <IconTile icon={tone === 'danger' ? 'trash' : 'shield'} size={20} className={tone === 'danger' ? 'flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF0EE] text-[#D15B50]' : 'flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF5E9] text-[#438352]'}/>
    <ModalTitle className="mt-4 text-lg font-black text-[#17382C]">{title}</ModalTitle>
    <div className="mt-1.5 text-xs leading-5 text-[#7C8D85]">{description}</div>
    <ModalFooter>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button loading={loading} onClick={onConfirm} className={tone === 'danger' ? 'bg-[#C9483D] shadow-none hover:bg-[#B23D33]' : undefined}>{confirmLabel}</Button>
    </ModalFooter>
  </Modal>
}
