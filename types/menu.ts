export interface TranslatedContent {
  'pt-BR': string
  en: string
  es?: string
  zh?: string
  ja?: string
}

export interface Category {
  id: string
  restaurant_id: string
  name: TranslatedContent
  description?: TranslatedContent
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Subcategory {
  id: string
  category_id: string
  restaurant_id: string
  name: TranslatedContent
  description?: TranslatedContent
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Dish {
  id: string
  restaurant_id: string
  category_id: string
  subcategory_id?: string
  name: TranslatedContent
  description?: TranslatedContent
  base_price: number
  display_order: number
  is_active: boolean
  is_available: boolean
  created_at: string
  updated_at: string
  dish_images?: DishImage[]
  dish_ingredients?: DishIngredient[]
}

export interface DishImage {
  id: string
  dish_id: string
  image_url: string
  display_order: number
  is_primary: boolean
  created_at: string
}

export interface Ingredient {
  id: string
  restaurant_id: string
  name: TranslatedContent
  price: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DishIngredient {
  id: string
  dish_id: string
  ingredient_id: string
  is_optional: boolean
  is_removable: boolean
  is_included_by_default: boolean
  additional_price: number
  created_at: string
  ingredient?: Ingredient
}
