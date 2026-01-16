"use client"

import { useState } from 'react'
import EditDishModal from './EditDishModal'
import DishSearch from './DishSearch'

interface MenuDishesListProps {
  dishes: any[]
  categories: any[]
  restaurantId: string
}

export default function MenuDishesList({ dishes, categories, restaurantId }: MenuDishesListProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredDishes = dishes.filter(dish => {
    const dishName = typeof dish.name === 'object' 
      ? dish.name['pt-BR'] || dish.name.en || '' 
      : dish.name
    return dishName.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const groupedByCategory = categories.map(category => ({
    category,
    dishes: filteredDishes.filter(dish => dish.category_id === category.id)
  })).filter(group => group.dishes.length > 0)

  return (
    <>
      {/* Barra de pesquisa */}
      <div className="mb-6">
        <DishSearch onSearch={setSearchQuery} />
      </div>

      {/* Lista de pratos agrupados por categoria */}
      {groupedByCategory.length === 0 ? (
        <div className="bg-white/85 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl shadow-xl backdrop-blur-xl p-12 text-center">
          <p className="text-stone-600 dark:text-stone-400">
            {searchQuery ? 'Nenhum prato encontrado com esse nome.' : 'Nenhum prato cadastrado ainda.'}
          </p>
        </div>
      ) : (
        groupedByCategory.map(({ category, dishes: categoryDishes }) => (
          <div
            key={category.id}
            className="bg-white/85 dark:bg-white/5 border-2 border-amber-500/15 rounded-2xl shadow-xl backdrop-blur-xl p-6 space-y-4 mb-8"
          >
            <div>
              <h2 className="text-2xl font-bold text-stone-900 dark:text-white">
                {category.name['pt-BR'] || category.name['en'] || 'Categoria'}
              </h2>
              <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                {typeof category.description === 'object' 
                  ? (category.description?.['pt-BR'] || category.description?.['en'] || 'Listagem de pratos')
                  : (category.description || 'Listagem de pratos')
                }
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryDishes.map((dish) => {
                const dishData = {
                  id: dish.id,
                  restaurantId: restaurantId,
                  categoryId: dish.category_id,
                  name: dish.name,
                  description: dish.description,
                  basePrice: parseFloat(dish.base_price.toString()),
                  isAvailable: dish.is_available,
                  availableDays: dish.available_days,
                  images: dish.dish_images?.map((img: any) => ({
                    id: img.id,
                    imageUrl: img.image_url
                  })),
                  dishIngredients: dish.dish_ingredients?.filter((di: any) => di.ingredients).map((di: any) => ({
                    id: di.id,
                    ingredient: {
                      id: di.ingredients.id,
                      name: di.ingredients.name,
                      price: di.ingredients.price || 0,
                      imageUrl: di.ingredients.image_url
                    },
                    additionalPrice: di.additional_price || 0
                  })) || []
                }
                
                return (
                  <EditDishModal
                    key={dish.id}
                    dish={dishData}
                    categories={categories}
                  >
                    <div className="group bg-white/90 dark:bg-white/5 border border-amber-500/15 rounded-2xl overflow-hidden shadow-lg hover:shadow-amber-500/20 hover:border-amber-400/40 transition duration-200 backdrop-blur-xl">
                      {dish.dish_images && dish.dish_images.length > 0 && (
                        <div className="aspect-video bg-stone-100 dark:bg-stone-900 relative overflow-hidden">
                          <img
                            src={dish.dish_images.find((img: any) => img.is_primary)?.image_url || dish.dish_images[0].image_url}
                            alt={dish.name['pt-BR'] || 'Dish'}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                        </div>
                      )}
                      <div className="p-4 space-y-2">
                        <h3 className="font-semibold text-stone-900 dark:text-white">
                          {dish.name['pt-BR'] || dish.name['en'] || 'Prato'}
                        </h3>
                        <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-2">
                          {dish.description?.['pt-BR'] || dish.description?.['en'] || ''}
                        </p>
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-lg font-bold text-amber-600 dark:text-amber-300">
                            R$ {parseFloat(dish.base_price.toString()).toFixed(2)}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full border ${
                              dish.is_available
                                ? 'bg-green-100/80 text-green-800 border-green-200 dark:bg-green-500/10 dark:text-green-200 dark:border-green-500/30'
                                : 'bg-red-100/80 text-red-800 border-red-200 dark:bg-red-500/10 dark:text-red-200 dark:border-red-500/30'
                            }`}
                          >
                            {dish.is_available ? 'Disponível' : 'Indisponível'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </EditDishModal>
                )
              })}
            </div>
          </div>
        ))
      )}
    </>
  )
}
