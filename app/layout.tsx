import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { I18nProvider } from '@/components/providers/I18nProvider'
import { ReduxProvider } from '@/store/provider'
import faviconPng from '@/app/(public)/favicon/favicon.png'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'iMenuFlow',
  description: 'Complete digital menu solution for restaurants',
  icons: {
    icon: faviconPng.src,
    shortcut: faviconPng.src,
    apple: faviconPng.src,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ReduxProvider>
          <ThemeProvider>
            <I18nProvider>
              {children}
            </I18nProvider>
          </ThemeProvider>
        </ReduxProvider>
        <div id="modal-root"></div>
      </body>
    </html>
  )
}
