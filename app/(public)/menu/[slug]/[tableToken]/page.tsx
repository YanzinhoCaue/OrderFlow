import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{
    slug: string
    tableToken: string
  }>
}

export default async function PublicMenuPage({ params }: Props) {
  const { slug, tableToken } = await params
  const supabase = await createClient()

  // Get restaurant by slug
  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (restaurantError || !restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Restaurante não encontrado
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            O restaurante que você procura não está disponível
          </p>
        </div>
      </div>
    )
  }

  // Get table by token
  const { data: table, error: tableError } = await supabase
    .from('tables')
    .select('*')
    .eq('qr_code_token', tableToken)
    .eq('restaurant_id', (restaurant as any).id)
    .eq('is_active', true)
    .single()

  if (tableError || !table) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Mesa não encontrada
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Esta mesa não está disponível ou foi desativada
          </p>
        </div>
      </div>
    )
  }

  // Get categories and dishes
  const { data: categories } = await supabase
    .from('categories')
    .select(`
      *,
      dishes (
        *,
        dish_images (*),
        dish_ingredients (
          *,
          ingredients (*)
        )
      )
    `)
    .eq('restaurant_id', (restaurant as any).id)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
      style={{
        '--primary-color': (restaurant as any).theme_color,
      } as React.CSSProperties}
    >
      {/* Header with restaurant info */}
      <div className="relative h-48 bg-gradient-to-br from-primary to-primary-dark">
        {(restaurant as any).cover_url && (
          <img
            src={(restaurant as any).cover_url}
            alt={(restaurant as any).name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="relative h-full flex flex-col items-center justify-center text-white px-4">
          {(restaurant as any).logo_url && (
            <img
              src={(restaurant as any).logo_url}
              alt={(restaurant as any).name}
              className="w-20 h-20 rounded-full bg-white p-2 mb-3 shadow-lg"
            />
          )}
          <h1 className="text-3xl font-bold">{(restaurant as any).name}</h1>
          <p className="text-sm opacity-90 mt-1">Mesa {(table as any).table_number}</p>
        </div>
      </div>

      {/* Menu Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {categories && categories.length > 0 ? (
          <div className="space-y-8">
            {categories.map((category: any) => (
              <div key={category.id}>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 sticky top-0 bg-gray-50 dark:bg-gray-900 py-2 z-10">
                  {category.name['pt-BR'] || category.name['en'] || 'Unnamed'}
                </h2>
                
                <div className="space-y-4">
                  {category.dishes
                    .filter((dish: any) => dish.is_active && dish.is_available)
                    .map((dish: any) => (
                      <div
                        key={dish.id}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="flex">
                          {dish.dish_images && dish.dish_images.length > 0 && (
                            <div className="w-32 h-32 flex-shrink-0">
                              <img
                                src={
                                  dish.dish_images.find((img: any) => img.is_primary)?.image_url ||
                                  dish.dish_images[0].image_url
                                }
                                alt={dish.name['pt-BR']}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 p-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                              {dish.name['pt-BR'] || dish.name['en'] || 'Unnamed'}
                            </h3>
                            {dish.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {dish.description['pt-BR'] || dish.description['en'] || ''}
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-primary">
                                R$ {parseFloat(dish.base_price.toString()).toFixed(2)}
                              </span>
                              <button
                                className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
                              >
                                Adicionar
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              Cardápio em breve...
            </p>
          </div>
        )}
      </div>

      {/* Floating Cart Button - Para futura implementação */}
      <div className="fixed bottom-6 right-6">
        <button className="bg-primary text-white px-6 py-3 rounded-full shadow-lg hover:bg-primary-dark transition-all flex items-center gap-2">
          <span className="font-semibold">Ver Pedido</span>
          <span className="bg-white text-primary rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
            0
          </span>
        </button>
      </div>
    </div>
  )
}
