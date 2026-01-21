import { createClient } from '@/lib/supabase/server'
import { getRestaurantByOwner } from '@/app/actions/categories'
import { getDishes } from '@/app/actions/dishes'
import { getCategories } from '@/app/actions/categories'
import Link from 'next/link'
import { FiPlus } from 'react-icons/fi'
import Button from '@/components/ui/Button'
import MenuActions from '@/components/dashboard/MenuActions'
import DeleteCategoryButton from '@/components/dashboard/DeleteCategoryButton'
import NewDishModal from '@/components/dashboard/NewDishModal'
import IngredientsManager from '@/components/dashboard/IngredientsManager'
import MenuDishesList from '@/components/dashboard/MenuDishesList'
import { cookies } from 'next/headers'
import { getDictionary, translate } from '@/lib/i18n/server'

export default async function MenuPage() {
  const cookieStore = await cookies()
  const locale = (cookieStore.get('locale')?.value as any) || 'pt-BR'
  const dict = await getDictionary(locale)
  const t = (key: string) => translate(dict, key)
  const restaurant = await getRestaurantByOwner()

  if (!restaurant) {
    return <div>Restaurant not found</div>
  }

  const [dishes, categories] = await Promise.all([
    getDishes((restaurant as any).id),
    getCategories((restaurant as any).id),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white/80 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl px-6 py-4 shadow-xl backdrop-blur-xl">
        <div>
          <p className="text-sm text-stone-600 dark:text-stone-400">{t('dashboard.menuPage.heading')}</p>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#b45309] via-[#d97706] to-[#f59e0b] dark:from-amber-200 dark:via-amber-400 dark:to-orange-500 bg-clip-text text-transparent">
            {t('dashboard.menuPage.title')}
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">
            {t('dashboard.menuPage.subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <IngredientsManager restaurantId={(restaurant as any).id} buttonText={t('dashboard.menuPage.ingredients')} />
          <MenuActions restaurantId={(restaurant as any).id} buttonText={t('dashboard.menuPage.category')} />
          <NewDishModal 
            restaurantId={(restaurant as any).id} 
            categories={categories as any}
            buttonText={t('dashboard.menuPage.newDish')}
          />
        </div>
      </div>

      <div className="space-y-8">
        {categories.length === 0 ? (
          <div className="bg-white/85 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl shadow-xl backdrop-blur-xl p-12 text-center">
            <h3 className="text-lg font-semibold text-stone-900 dark:text-white mb-2">
              {t('dashboard.menuPage.emptyTitle')}
            </h3>
            <p className="text-stone-600 dark:text-stone-400 mb-6">
              {t('dashboard.menuPage.emptyDesc')}
            </p>
            <MenuActions
              restaurantId={(restaurant as any).id}
              buttonText={t('dashboard.menuPage.emptyCta')}
              buttonClassName="bg-amber-500 hover:bg-amber-600 text-white border border-amber-500/70"
            />
          </div>
        ) : (
          <MenuDishesList 
            dishes={dishes as any} 
            categories={categories as any}
            restaurantId={(restaurant as any).id}
          />
        )}
      </div>
    </div>
  )
}
