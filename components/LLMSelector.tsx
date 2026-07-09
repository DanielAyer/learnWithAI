'use client'

import { useEffect, useRef, useState } from 'react'
import { LLMConfig, LLMConfigStore } from '@/types'
import Link from 'next/link'

export default function LLMSelector() {
  const [store, setStore] = useState<LLMConfigStore | null>(null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchStore()
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function fetchStore() {
    const res = await fetch('/api/llm-configs')
    const data = await res.json()
    setStore(data)
  }

  async function handleSelect(index: number) {
    const res = await fetch('/api/llm-configs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activeIndex: index })
    })
    const data = await res.json()
    setStore(data)
    setOpen(false)
  }

  async function handleSetPrimary() {
    if (!store) return
    const configs = [...store.configs]
    const activeConfig = configs[store.activeIndex]

    // Move active to index 0, shift others down
    const reordered = [
      { ...activeConfig, index: 0 },
      ...configs
        .filter(c => c.id !== activeConfig.id)
        .map((c, i) => ({ ...c, index: i + 1 }))
    ]

    const res = await fetch('/api/llm-configs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configs: reordered, activeIndex: 0 })
    })
    const data = await res.json()
    setStore(data)
  }

  if (!store || store.configs.length === 0) {
    return (
      <Link
        href="/settings/llm"
        className="font-mono text-xs text-muted hover:text-secondary transition-colors"
      >
        + configure llm
      </Link>
    )
  }

  const activeConfig = store.configs[store.activeIndex] ?? store.configs[0]
  const isPrimary = store.activeIndex === 0
  const sorted = [...store.configs].sort((a, b) => a.index - b.index)

  return (
    <div className="flex items-center gap-2" ref={ref}>
      {/* Set as Primary button — only shown when active is not index 0 */}
      {!isPrimary && (
        <button
          onClick={handleSetPrimary}
          className="text-xs text-orange-500 hover:text-orange-600 transition-colors font-medium"
        >
          Set as Primary
        </button>
      )}

      {/* Selector */}
      <div className="relative">
        <button
          onClick={() => setOpen(prev => !prev)}
          className="font-mono text-xs bg-gray-100 hover:bg-gray-200 transition-colors px-3 py-1.5 rounded-lg flex items-center gap-2"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${
            activeConfig.status === 'connected' ? 'bg-green-400' :
            activeConfig.status === 'failed' ? 'bg-red-400' :
            'bg-gray-400'
          }`} />
          {activeConfig.label}
          <span className="text-muted">▾</span>
        </button>

        {open && (
          <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
            {sorted.map(config => (
              <button
                key={config.id}
                onClick={() => handleSelect(config.index)}
                className={`w-full text-left px-4 py-2.5 text-xs flex items-center gap-2 hover:bg-gray-50 transition-colors ${
                  config.index === store.activeIndex ? 'bg-orange-50 text-orange-600' : 'text-secondary'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  config.status === 'connected' ? 'bg-green-400' :
                  config.status === 'failed' ? 'bg-red-400' :
                  'bg-gray-400'
                }`} />
                <span className="flex-1">{config.label}</span>
                {config.index === 0 && (
                  <span className="text-muted text-xs">primary</span>
                )}
              </button>
            ))}
            <div className="border-t border-gray-100">
              <Link
                href="/settings/llm"
                className="block px-4 py-2.5 text-xs text-secondary hover:bg-gray-50 transition-colors"
                onClick={() => setOpen(false)}
              >
                Manage LLMs →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}