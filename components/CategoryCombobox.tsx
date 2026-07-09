'use client'

import { useState, useRef, useEffect } from 'react'

const PRESET_CATEGORIES = [
  'Programming & Software Dev',
  'Systems & Infrastructure',
  'Mathematics & Theory',
  'Data & ML / AI',
  'Design & UI/UX',
  'Product & Business',
  'Security',
  'Networking',
]

interface Props {
  selected: string[]
  onChange: (categories: string[]) => void
}

export default function CategoryCombobox({ selected, onChange }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Filter suggestions — exclude already selected, match query
  const suggestions = PRESET_CATEGORIES.filter(cat =>
    !selected.includes(cat) &&
    cat.toLowerCase().includes(query.toLowerCase())
  )

  // Show custom entry option if query doesn't match any preset
  const showCustom = query.trim().length > 0 &&
    !PRESET_CATEGORIES.some(cat => cat.toLowerCase() === query.toLowerCase()) &&
    !selected.includes(query.trim())

  function addCategory(cat: string) {
    onChange([...selected, cat])
    setQuery('')
    inputRef.current?.focus()
  }

  function removeCategory(cat: string) {
    onChange(selected.filter(c => c !== cat))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault()
      if (suggestions.length > 0) {
        addCategory(suggestions[0])
      } else if (showCustom) {
        addCategory(query.trim())
      }
    }
    if (e.key === 'Backspace' && !query && selected.length > 0) {
      removeCategory(selected[selected.length - 1])
    }
    if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={ref} className="flex flex-col gap-2">
      {/* Selected tags */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map(cat => (
            <span
              key={cat}
              className="flex items-center gap-1 text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2 py-1 rounded-lg"
            >
              {cat}
              <button
                onClick={() => removeCategory(cat)}
                className="text-orange-400 hover:text-orange-600 transition-colors ml-1"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search or add a category..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />

        {/* Dropdown */}
        {open && (suggestions.length > 0 || showCustom) && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
            {suggestions.map(cat => (
              <button
                key={cat}
                onClick={() => addCategory(cat)}
                className="w-full text-left px-4 py-2.5 text-xs text-secondary hover:bg-gray-50 transition-colors"
              >
                {cat}
              </button>
            ))}
            {showCustom && (
              <button
                onClick={() => addCategory(query.trim())}
                className="w-full text-left px-4 py-2.5 text-xs text-orange-600 hover:bg-orange-50 transition-colors border-t border-gray-100"
              >
                + Add "{query.trim()}"
              </button>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-muted">
        Press Enter to add. Backspace to remove last. Type anything to add a custom category.
      </p>
    </div>
  )
}