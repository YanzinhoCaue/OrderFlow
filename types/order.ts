import { OrderStatus } from '@/lib/supabase/types'
import { TranslatedContent } from './menu'

export interface Order {
  id: string
  restaurant_id: string
  table_id: string
  order_number: number
  customer_name?: string
  status: OrderStatus
  total_amount: number
  notes?: string
  created_at: string
  updated_at: string
  table?: Table
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  dish_id: string
  quantity: number
  unit_price: number
  total_price: number
  notes?: string
  created_at: string
  dish?: {
    id: string
    name: TranslatedContent
    description?: TranslatedContent
  }
  order_item_ingredients?: OrderItemIngredient[]
}

export interface OrderItemIngredient {
  id: string
  order_item_id: string
  ingredient_id: string
  was_added: boolean
  price: number
  created_at: string
  ingredient?: {
    id: string
    name: TranslatedContent
  }
}

export interface Table {
  id: string
  restaurant_id: string
  table_number: string
  qr_code_url?: string
  qr_code_token: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface OrderStatusHistory {
  id: string
  order_id: string
  status: OrderStatus
  changed_by?: string
  notes?: string
  created_at: string
}
