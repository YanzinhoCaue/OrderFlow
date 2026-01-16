"use client"

import { useState, useRef, useEffect } from 'react'
import { FiSearch } from 'react-icons/fi'

interface Ingredient {
  id: string
  name: string | Record<string, string>
  price?: number
}

interface IngredientAutocompleteProps {
  ingredients: Ingredient[]
  onSelect: (ingredientId: string) => void
  selectedIds: string[]
  disabled?: boolean
}

export default function IngredientAutocomplete({
  ingredients,
  onSelect,
  selectedIds,
  disabled
}: IngredientAutocompleteProps) {
  const [search, setSearch] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const availableIngredients = ingredients.filter(
    ing => !selectedIds.includes(ing.id)
  )

  const filteredIngredients = search.trim()
    ? availableIngredients.filter(ing => {
        const name = typeof ing.name === 'object'
          ? ing.name['pt-BR'] || ing.name.en || ''
          : ing.name
        return name.toLowerCase().includes(search.toLowerCase())
      })
    : []

  useEffect(() => {
    setHighlightedIndex(0)
  }, [search])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (ingredientId: string) => {
    onSelect(ingredientId)
    setSearch('')
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredIngredients.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev < filteredIngredients.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filteredIngredients[highlightedIndex]) {
          handleSelect(filteredIngredients[highlightedIndex].id)
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        break
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" size={18} />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => search && setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder="Pesquisar ingredientes..."
          className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-amber-500/30 dark:border-amber-500/40 bg-white/80 dark:bg-slate-900/60 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          disabled={disabled}
        />
      </div>

      {showSuggestions && search && filteredIngredients.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-amber-500/30 dark:border-amber-500/40 rounded-lg shadow-xl max-h-60 overflow-y-auto"
        >
          {filteredIngredients.map((ingredient, index) => {
            const name = typeof ingredient.name === 'object'
              ? ingredient.name['pt-BR'] || ingredient.name.en || ''
              : ingredient.name

            return (
              <button
                key={ingredient.id}
                type="button"
                onClick={() => handleSelect(ingredient.id)}
                className={`w-full px-4 py-2.5 text-left text-sm hover:bg-amber-50/80 dark:hover:bg-amber-500/10 transition-colors ${
                  index === highlightedIndex
                    ? 'bg-amber-50/80 dark:bg-amber-500/10'
                    : ''
                } ${index > 0 ? 'border-t border-amber-500/10' : ''}`}
              >
                <div className="font-medium text-stone-900 dark:text-white">
                  {name}
                </div>
                {ingredient.price && ingredient.price > 0 && (
                  <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Preço base: R$ {ingredient.price.toFixed(2)}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {showSuggestions && search && filteredIngredients.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-amber-500/30 dark:border-amber-500/40 rounded-lg shadow-xl px-4 py-3">
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Nenhum ingrediente encontrado
          </p>
        </div>
      )}
    </div>
  )
}
