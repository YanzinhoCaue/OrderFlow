"use client"

import { useState } from 'react'
import { FiSearch } from 'react-icons/fi'

interface DishSearchProps {
  onSearch: (query: string) => void
}

export default function DishSearch({ onSearch }: DishSearchProps) {
  const [search, setSearch] = useState('')

  const handleChange = (value: string) => {
    setSearch(value)
    onSearch(value)
  }

  return (
    <div className="relative">
      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" size={20} />
      <input
        type="text"
        placeholder="Pesquisar pratos..."
        value={search}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2 border border-amber-500/30 dark:border-amber-500/40 bg-white/80 dark:bg-slate-900/60 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
      />
    </div>
  )
}
