'use client'

import { useEffect, useState } from 'react'
import { LLMConfig, LLMConfigStore } from '@/types'
import LLMTile from '@/components/LLMTile'
import LLMModal from '@/components/LLMModal'

export default function LLMSettingsPage() {
  const [store, setStore] = useState<LLMConfigStore | null>(null)
  const [staged, setStaged] = useState<LLMConfigStore | null>(null)
  const [dirty, setDirty] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingConfig, setEditingConfig] = useState<LLMConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [globalTimeout, setGlobalTimeout] = useState<string>('')

  useEffect(() => {
    fetchStore()
  }, [])

  async function fetchStore() {
    const res = await fetch('/api/llm-configs')
    const data: LLMConfigStore = await res.json()
    setStore(data)
    setStaged(data)
    setGlobalTimeout(String(data.globalTimeoutMs))
  }

  function markDirty(updated: LLMConfigStore) {
    setStaged(updated)
    setDirty(true)
  }

  function handleGlobalTimeoutBlur() {
    if (!staged) return
    const parsed = parseInt(globalTimeout)
    if (isNaN(parsed) || parsed < 1000) {
      setGlobalTimeout(String(staged.globalTimeoutMs))
      return
    }
    markDirty({ ...staged, globalTimeoutMs: parsed })
  }

  function handleIndexChange(id: string, newIndex: number) {
    if (!staged) return
    const configs = [...staged.configs]
    const movingConfig = configs.find(c => c.id === id)
    if (!movingConfig) return

    const oldIndex = movingConfig.index

    // Shift other configs to make room
    const reordered = configs.map(c => {
      if (c.id === id) return { ...c, index: newIndex }
      if (newIndex < oldIndex) {
        // Moving up — shift others down
        if (c.index >= newIndex && c.index < oldIndex) {
          return { ...c, index: c.index + 1 }
        }
      } else {
        // Moving down — shift others up
        if (c.index > oldIndex && c.index <= newIndex) {
          return { ...c, index: c.index - 1 }
        }
      }
      return c
    })

    reordered.sort((a, b) => a.index - b.index)
    markDirty({ ...staged, configs: reordered })
  }

  function handleEdit(config: LLMConfig) {
    setEditingConfig(config)
    setShowModal(true)
  }

  function handleDelete(id: string) {
    if (!staged) return
    const configs = staged.configs
      .filter(c => c.id !== id)
      .map((c, i) => ({ ...c, index: i }))
    const activeIndex = Math.min(staged.activeIndex, Math.max(0, configs.length - 1))
    markDirty({ ...staged, configs, activeIndex })
  }

  async function handleModalSave(partial: Partial<LLMConfig>) {
    if (!staged) return

    if (editingConfig) {
      // Edit existing
      const configs = staged.configs.map(c =>
        c.id === editingConfig.id ? { ...c, ...partial, status: 'untested' as const } : c
      )
      markDirty({ ...staged, configs })
    } else {
      // Add new
      const res = await fetch('/api/llm-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial)
      })
      const newConfig: LLMConfig = await res.json()
      markDirty({ ...staged, configs: [...staged.configs, newConfig] })
    }

    setShowModal(false)
    setEditingConfig(null)
  }

  async function handleSave() {
    if (!staged) return
    setSaving(true)
    await fetch('/api/llm-configs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        configs: staged.configs,
        globalTimeoutMs: staged.globalTimeoutMs,
        activeIndex: staged.activeIndex
      })
    })
    setStore(staged)
    setDirty(false)
    setSaving(false)
  }

  function handleDiscard() {
    if (!store) return
    setStaged(store)
    setGlobalTimeout(String(store.globalTimeoutMs))
    setDirty(false)
  }

  if (!staged) return <p className="text-gray-500">Loading...</p>

  const sorted = [...staged.configs].sort((a, b) => a.index - b.index)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">LLM Configuration</h1>
        <button
          onClick={() => {
            setEditingConfig(null)
            setShowModal(true)
          }}
          className="text-sm bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
        >
          + Add LLM
        </button>
      </div>

      {/* Unsaved changes banner */}
      {dirty && (
        <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-6">
          <span className="text-sm text-yellow-700">You have unsaved changes</span>
          <div className="flex gap-2">
            <button
              onClick={handleDiscard}
              className="text-sm border border-yellow-200 text-yellow-700 px-4 py-1.5 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-sm bg-yellow-500 text-white px-4 py-1.5 rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-40"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Global timeout */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-gray-900">Global Timeout</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Default timeout for all LLMs unless overridden per config
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={globalTimeout}
            onChange={e => setGlobalTimeout(e.target.value)}
            onBlur={handleGlobalTimeoutBlur}
            className="w-28 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-mono text-right"
          />
          <span className="text-sm text-gray-400">ms</span>
        </div>
      </div>

      {/* LLM tiles */}
      {sorted.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">No LLMs configured yet.</p>
          <p className="text-xs mt-1">Click "Add LLM" to get started.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map(config => (
            <LLMTile
              key={config.id}
              config={config}
              globalTimeoutMs={staged.globalTimeoutMs}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onIndexChange={handleIndexChange}
              totalConfigs={staged.configs.length}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <LLMModal
          initial={editingConfig ?? undefined}
          onSave={handleModalSave}
          onCancel={() => {
            setShowModal(false)
            setEditingConfig(null)
          }}
          globalTimeoutMs={staged.globalTimeoutMs}
        />
      )}
    </div>
  )
}