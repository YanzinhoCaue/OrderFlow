"use client"

import { useState } from 'react'
import { FiSearch } from 'react-icons/fi'

interface TableSearchProps {
  onSearch: (query: string) => void
}

export default function TableSearch({ onSearch }: TableSearchProps) {
  const [searchValue, setSearchValue] = useState('')

  const handleChange = (value: string) => {
    setSearchValue(value)
    onSearch(value)
  }

  return (
    <div className="relative">
      <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" size={20} />
      <input
        type="text"
        value={searchValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Pesquisar mesas..."
        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-amber-500/30 dark:border-amber-500/40 bg-white/80 dark:bg-slate-900/60 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition-all"
      />
    </div>
  )
}
