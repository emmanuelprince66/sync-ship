import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { CUSTOMER_TRANSACTION_TYPES, useCustomer, useCustomerTransactions, useDeleteCustomer, type CustomerTransactionType } from '@/api/customers'
import { formatShortDate } from '@/api/http'
import type { IconName } from '@/components/ui/Icon'
import { useDisclosure } from '@/hooks/useDisclosure'
import { formatNaira } from '@/lib/format'
import { paths } from '@/routes/paths'
import { GENDER_LABELS } from '../schemas'

const TRANSACTIONS_PAGE_SIZE = 10

/** "Apr 18, 1992", or "04-18" as saved when no year was given. */
const formatBirthday = (value: string) => (value.length > 5 ? formatShortDate(`${value.slice(0, 10)}T00:00:00`) : value)

/** A customer's profile (customer/single/{id}/) and transaction history (customer/transactions/{id}/), with edit and delete. */
export function useCustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>()
  const navigate = useNavigate()
  const detail = useCustomer(customerId)
  const [type, setType] = useState<CustomerTransactionType>('ALL')
  const [page, setPage] = useState(1)
  // Waits for the profile, so a deleted or unknown customer doesn't fire a second failing request.
  const transactions = useCustomerTransactions(customerId, { page, limit: TRANSACTIONS_PAGE_SIZE, type }, detail.isSuccess)
  const edit = useDisclosure()
  const confirmDelete = useDisclosure()
  const remove = useDeleteCustomer()
  const goBack = () => navigate(paths.customers)

  const data = detail.data
  const customer = data?.customer ?? null
  const address = customer?.address

  return {
    goBack,
    isLoading: detail.isLoading,
    isError: detail.isError,
    retry: () => void detail.refetch(),
    customer,
    subtitle: customer ? [customer.code, data?.tier && `${data.tier} tier`, data?.segment].filter(Boolean).join(' · ') || customer.phone : '',
    stats: data
      ? ([
          { label: `Total spend · ${data.totalOrders} order${data.totalOrders === 1 ? '' : 's'}`, value: formatNaira(data.totalSpend), icon: 'chart', color: '#3664E8' },
          { label: 'Average order', value: formatNaira(data.averageBasket), icon: 'box', color: '#438352' },
          { label: 'Wallet balance', value: formatNaira(data.walletBalance), icon: 'wallet', color: '#286B43' },
          { label: data.outstandingBalance > 0 ? 'Outstanding · owed to you' : 'Outstanding', value: formatNaira(data.outstandingBalance), icon: 'card', color: '#C2483D' },
        ] satisfies { label: string; value: string; icon: IconName; color: string }[])
      : [],
    details: customer
      ? ([
          ['Phone', customer.phone || '—'],
          ['Email', customer.email || '—'],
          ['Gender', GENDER_LABELS[customer.gender] ?? '—'],
          ['Date of birth', customer.dateOfBirth ? formatBirthday(customer.dateOfBirth) : '—'],
          ['Address', address ? [address.address, address.city, address.state].filter(Boolean).join(', ') : '—'],
          ['Customer since', data?.customerSince || '—'],
          ['Last purchase', data?.lastPurchase ? formatShortDate(data.lastPurchase) : '—'],
          ['Favourite product', data?.favouriteProduct || '—'],
          ['Preferred payment', data?.preferredPayment || '—'],
        ] as [string, string][])
      : [],
    notes: customer?.notes ?? '',
    transactions: {
      types: CUSTOMER_TRANSACTION_TYPES,
      type,
      setType: (next: CustomerTransactionType) => { setType(next); setPage(1) },
      rows: transactions.data?.rows ?? [],
      isLoading: transactions.isLoading,
      isFetching: transactions.isFetching && !transactions.isLoading,
      isError: transactions.isError && !transactions.data,
      retry: () => void transactions.refetch(),
      page,
      pages: transactions.data?.pages ?? 1,
      setPage,
    },
    edit,
    confirmDelete,
    isDeleting: remove.isPending,
    deleteCustomer: () => customer && remove.mutate(customer.id, {
      onSuccess: () => { toast.success(`${customer.name} deleted`); goBack() },
      onError: error => toast.error(errorMessage(error, 'Could not delete this customer.')),
    }),
  }
}

export type CustomerDetailModel = ReturnType<typeof useCustomerDetailPage>
