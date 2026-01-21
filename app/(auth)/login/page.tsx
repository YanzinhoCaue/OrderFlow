import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginButton from '@/components/auth/LoginButton'
import ThemeSwitcher from '@/components/shared/ThemeSwitcher'
import { FiZap, FiClock, FiUsers, FiGlobe } from 'react-icons/fi'

interface Props {
  searchParams: Promise<{
    redirect?: string
  }>
}

export default async function LoginPage({ searchParams }: Props) {
  const { redirect: redirectUrl } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect(redirectUrl || '/dashboard')
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#f8ecdd] via-[#f2d7b5] to-[#e5c39a] dark:from-[#0b1021] dark:via-[#12182a] dark:to-[#0f172a]">
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <div className="glass px-3 py-2 rounded-xl border border-white/20">
          <ThemeSwitcher />
        </div>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-15">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c46c1c' fill-opacity='0.18'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Floating Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-amber-600/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-700/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Side - Branding & Info */}
          <div className="text-stone-900 dark:text-white space-y-8 animate-slideInLeft">
            {/* Logo/Brand */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg animate-pulse-glow">
                  <FiZap className="text-2xl text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-amber-400 tracking-wider">POWERED BY</div>
                  <div className="text-2xl font-bold tracking-tight uppercase bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">KRIN.TECH</div>
                </div>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-[#b45309] via-[#d97706] to-[#f59e0b] dark:from-amber-200 dark:via-amber-400 dark:to-orange-500 bg-clip-text text-transparent leading-snug">
                iMenuFlow
              </h1>
              <p className="text-xl text-stone-600 dark:text-stone-300 font-light">
                Transforme seu restaurante com cardápio digital inteligente
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid sm:grid-cols-2 gap-4 pt-4">
              <div className="glass p-4 rounded-xl hover:bg-white/20 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <FiZap className="text-amber-400 text-xl" />
                </div>
                <h3 className="font-semibold text-stone-900 dark:text-white mb-1">Pedidos em Tempo Real</h3>
                <p className="text-sm text-stone-700 dark:text-stone-400">Sincronização instantânea entre cozinha e mesas</p>
              </div>

              <div className="glass p-4 rounded-xl hover:bg-white/20 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <FiClock className="text-amber-400 text-xl" />
                </div>
                <h3 className="font-semibold text-stone-900 dark:text-white mb-1">QR Code Inteligente</h3>
                <p className="text-sm text-stone-700 dark:text-stone-400">Acesso rápido ao cardápio para seus clientes</p>
              </div>

              <div className="glass p-4 rounded-xl hover:bg-white/20 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <FiUsers className="text-amber-400 text-xl" />
                </div>
                <h3 className="font-semibold text-stone-900 dark:text-white mb-1">Dashboard Completo</h3>
                <p className="text-sm text-stone-700 dark:text-stone-400">Gestão de cozinha e garçons em um só lugar</p>
              </div>

              <div className="glass p-4 rounded-xl hover:bg-white/20 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <FiGlobe className="text-amber-400 text-xl" />
                </div>
                <h3 className="font-semibold text-stone-900 dark:text-white mb-1">Multilíngue</h3>
                <p className="text-sm text-stone-700 dark:text-stone-400">Suporte a 5 idiomas para clientes internacionais</p>
              </div>
            </div>
          </div>

          {/* Right Side - Login Card */}
          <div className="animate-slideInRight">
            <div className="rounded-3xl p-8 md:p-12 shadow-2xl border-2 border-amber-500/30 bg-white/80 dark:bg-white/5 backdrop-blur-2xl">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 mb-4 shadow-lg animate-pulse-glow">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-stone-900 dark:text-white mb-2">
                  Bem-vindo de volta
                </h2>
                <p className="text-stone-600 dark:text-stone-400">
                  Acesse sua conta para gerenciar seu restaurante
                </p>
              </div>

              <LoginButton redirectUrl={redirectUrl} />

              <div className="mt-8 pt-6 border-t border-amber-500/20 dark:border-white/10">
                <p className="text-center text-sm text-stone-600 dark:text-stone-400">
                  Ao entrar, você concorda com nossos{' '}
                  <a href="#" className="text-amber-400 hover:text-amber-300 transition-colors">
                    Termos de Serviço
                  </a>
                </p>
              </div>
            </div>

            {/* Tech Badge */}
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm text-stone-700 dark:text-stone-300">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Plataforma segura e confiável
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
    </div>
  )
}
