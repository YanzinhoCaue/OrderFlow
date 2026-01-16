'use client'

import { FiInstagram, FiFacebook, FiTwitter } from 'react-icons/fi'
import { FaWhatsapp, FaTiktok } from 'react-icons/fa'

export type SocialMediaLinks = {
  instagram?: string
  facebook?: string
  whatsapp?: string
  twitter?: string
  tiktok?: string
}

interface SocialMediaProps {
  links: SocialMediaLinks
  onChange: (links: SocialMediaLinks) => void
}

const SOCIAL_PLATFORMS = [
  {
    key: 'instagram' as keyof SocialMediaLinks,
    label: 'Instagram',
    icon: FiInstagram,
    placeholder: '@seurestaurante',
    prefix: 'https://instagram.com/',
  },
  {
    key: 'facebook' as keyof SocialMediaLinks,
    label: 'Facebook',
    icon: FiFacebook,
    placeholder: 'seurestaurante',
    prefix: 'https://facebook.com/',
  },
  {
    key: 'whatsapp' as keyof SocialMediaLinks,
    label: 'WhatsApp',
    icon: FaWhatsapp,
    placeholder: '(11) 99999-9999',
    prefix: 'https://wa.me/',
  },
  {
    key: 'twitter' as keyof SocialMediaLinks,
    label: 'Twitter/X',
    icon: FiTwitter,
    placeholder: '@seurestaurante',
    prefix: 'https://twitter.com/',
  },
  {
    key: 'tiktok' as keyof SocialMediaLinks,
    label: 'TikTok',
    icon: FaTiktok,
    placeholder: '@seurestaurante',
    prefix: 'https://tiktok.com/@',
  },
]

export default function SocialMedia({ links, onChange }: SocialMediaProps) {
  const updateLink = (key: keyof SocialMediaLinks, value: string) => {
    onChange({ ...links, [key]: value })
  }

  return (
    <div className="space-y-4">
      {SOCIAL_PLATFORMS.map((platform) => {
        const Icon = platform.icon
        return (
          <div key={platform.key} className="p-4 bg-stone-50 dark:bg-white/5 rounded-lg border border-stone-200 dark:border-stone-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Icon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="font-medium text-stone-700 dark:text-stone-300">{platform.label}</span>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-stone-600 dark:text-stone-400">{platform.prefix}</label>
              <input
                type="text"
                placeholder={platform.placeholder}
                value={links[platform.key] || ''}
                onChange={(e) => updateLink(platform.key, e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-white/10 border border-stone-300 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-white placeholder-stone-400"
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
