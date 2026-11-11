import type { Customer } from '@/api/customers'
import { Button } from '@/components/ui/Button'
import { Modal, ModalFooter, ModalHeader } from '@/components/ui/Modal'

type Props = { customer: Customer | null; deleting: boolean; onCancel: () => void; onConfirm: () => void }

/** Sink's DeleteCustomer confirmation. */
export function DeleteCustomerModal({ customer, deleting, onCancel, onConfirm }: Props) {
  return <Modal open={Boolean(customer)} onClose={onCancel} panelClassName="w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_25px_80px_rgba(9,38,28,.2)]">
    <ModalHeader title="Delete this customer?" description={<><span className="font-extrabold text-[#17382C]">{customer?.name ?? 'This customer'}</span> and their contact details will be removed. Past orders keep their details.</>} align="start" onClose={onCancel}/>
    <ModalFooter className="[&>button]:flex-1 sm:[&>button]:flex-none"><Button variant="ghost" onClick={onCancel} disabled={deleting}>Cancel</Button><Button icon="trash" loading={deleting} onClick={onConfirm} className="bg-[#C2483D] shadow-none hover:bg-[#A93C32]">Delete customer</Button></ModalFooter>
  </Modal>
}
