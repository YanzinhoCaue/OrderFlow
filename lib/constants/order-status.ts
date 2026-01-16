import { OrderStatus } from '@/lib/supabase/types'

export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string
    color: string
    bgColor: string
    textColor: string
  }
> = {
  pending: {
    label: 'Pending',
    color: 'gray',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    textColor: 'text-gray-700 dark:text-gray-300',
  },
  received: {
    label: 'Received',
    color: 'blue',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
    textColor: 'text-blue-700 dark:text-blue-300',
  },
  in_preparation: {
    label: 'In Preparation',
    color: 'yellow',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    textColor: 'text-yellow-700 dark:text-yellow-300',
  },
  ready: {
    label: 'Ready',
    color: 'green',
    bgColor: 'bg-green-100 dark:bg-green-900',
    textColor: 'text-green-700 dark:text-green-300',
  },
  delivered: {
    label: 'Delivered',
    color: 'purple',
    bgColor: 'bg-purple-100 dark:bg-purple-900',
    textColor: 'text-purple-700 dark:text-purple-300',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'red',
    bgColor: 'bg-red-100 dark:bg-red-900',
    textColor: 'text-red-700 dark:text-red-300',
  },
}
