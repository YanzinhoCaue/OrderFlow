export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type OrderStatus =
  | 'pending'
  | 'received'
  | 'in_preparation'
  | 'ready'
  | 'delivered'
  | 'cancelled'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          cpf_cnpj: string | null
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          cpf_cnpj?: string | null
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          cpf_cnpj?: string | null
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      restaurants: {
        Row: {
          id: string
          owner_id: string
          name: string
          slug: string
          description: string | null
          phone: string | null
          logo_url: string | null
          cover_url: string | null
          theme_color: string
          is_active: boolean
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          slug: string
          description?: string | null
          phone?: string | null
          logo_url?: string | null
          cover_url?: string | null
          theme_color?: string
          is_active?: boolean
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          slug?: string
          description?: string | null
          phone?: string | null
          logo_url?: string | null
          cover_url?: string | null
          theme_color?: string
          is_active?: boolean
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          restaurant_id: string
          name: Json
          description: Json | null
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          name: Json
          description?: Json | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          name?: Json
          description?: Json | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      subcategories: {
        Row: {
          id: string
          category_id: string
          restaurant_id: string
          name: Json
          description: Json | null
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          restaurant_id: string
          name: Json
          description?: Json | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          restaurant_id?: string
          name?: Json
          description?: Json | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      dishes: {
        Row: {
          id: string
          restaurant_id: string
          category_id: string
          subcategory_id: string | null
          name: Json
          description: Json | null
          base_price: number
          display_order: number
          is_active: boolean
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          category_id: string
          subcategory_id?: string | null
          name: Json
          description?: Json | null
          base_price: number
          display_order?: number
          is_active?: boolean
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          category_id?: string
          subcategory_id?: string | null
          name?: Json
          description?: Json | null
          base_price?: number
          display_order?: number
          is_active?: boolean
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      dish_images: {
        Row: {
          id: string
          dish_id: string
          image_url: string
          display_order: number
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          dish_id: string
          image_url: string
          display_order?: number
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          dish_id?: string
          image_url?: string
          display_order?: number
          is_primary?: boolean
          created_at?: string
        }
      }
      ingredients: {
        Row: {
          id: string
          restaurant_id: string
          name: Json
          price: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          name: Json
          price?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          name?: Json
          price?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      dish_ingredients: {
        Row: {
          id: string
          dish_id: string
          ingredient_id: string
          is_optional: boolean
          is_removable: boolean
          is_included_by_default: boolean
          additional_price: number
          created_at: string
        }
        Insert: {
          id?: string
          dish_id: string
          ingredient_id: string
          is_optional?: boolean
          is_removable?: boolean
          is_included_by_default?: boolean
          additional_price?: number
          created_at?: string
        }
        Update: {
          id?: string
          dish_id?: string
          ingredient_id?: string
          is_optional?: boolean
          is_removable?: boolean
          is_included_by_default?: boolean
          additional_price?: number
          created_at?: string
        }
      }
      tables: {
        Row: {
          id: string
          restaurant_id: string
          table_number: string
          qr_code_url: string | null
          qr_code_token: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          table_number: string
          qr_code_url?: string | null
          qr_code_token?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          table_number?: string
          qr_code_url?: string | null
          qr_code_token?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          restaurant_id: string
          table_id: string
          order_number: number
          customer_name: string | null
          status: OrderStatus
          total_amount: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          table_id: string
          order_number?: number
          customer_name?: string | null
          status?: OrderStatus
          total_amount?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          table_id?: string
          order_number?: number
          customer_name?: string | null
          status?: OrderStatus
          total_amount?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          dish_id: string
          quantity: number
          unit_price: number
          total_price: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          dish_id: string
          quantity?: number
          unit_price: number
          total_price: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          dish_id?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          notes?: string | null
          created_at?: string
        }
      }
      order_item_ingredients: {
        Row: {
          id: string
          order_item_id: string
          ingredient_id: string
          was_added: boolean
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_item_id: string
          ingredient_id: string
          was_added?: boolean
          price?: number
          created_at?: string
        }
        Update: {
          id?: string
          order_item_id?: string
          ingredient_id?: string
          was_added?: boolean
          price?: number
          created_at?: string
        }
      }
      order_status_history: {
        Row: {
          id: string
          order_id: string
          status: OrderStatus
          changed_by: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          status: OrderStatus
          changed_by?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          status?: OrderStatus
          changed_by?: string | null
          notes?: string | null
          created_at?: string
        }
      }
    }
  }
}
