import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardSidebar from '@/components/dashboard/Sidebar'
import DashboardHeader from '@/components/dashboard/Header'
import { SidebarProvider } from '@/components/dashboard/SidebarContext'
import { MobileMenuProvider } from '@/components/dashboard/MobileMenuContext'
import DashboardLayoutClient from './DashboardLayoutClient'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', (profile as any).id)
    .single()

  // Provide a safe fallback to avoid null access in client components
  const safeRestaurant = restaurant ?? { name: 'Restaurante', logo_url: null }

  return (
    <SidebarProvider>
      <MobileMenuProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <DashboardSidebar restaurant={safeRestaurant} />
          <DashboardLayoutClient>
            <DashboardHeader user={user} restaurant={safeRestaurant} />
            <main className="p-4 sm:p-6">
              {children}
            </main>
          </DashboardLayoutClient>
        </div>
      </MobileMenuProvider>
    </SidebarProvider>
  )
}
