'use client'

import { useState } from 'react'
import { LLMConfig } from '@/types'

interface Props {
  config: LLMConfig
  globalTimeoutMs: number
  onEdit: (config: LLMConfig) => void
  onDelete: (id: string) => void
  onIndexChange: (id: string, newIndex: number) => void
  totalConfigs: number
}

const statusColors = {
  untested: 'bg-gray-200 text-secondary',
  connected: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-600'
}

const statusDot = {
  untested: 'bg-gray-400',
  connected: 'bg-green-400',
  failed: 'bg-red-400'
}

export default function LLMTile({
  config,
  globalTimeoutMs,
  onEdit,
  onDelete,
  onIndexChange,
  totalConfigs
}: Props) {
  const [indexInput, setIndexInput] = useState(String(config.index))
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleIndexBlur() {
    const parsed = parseInt(indexInput)
    if (isNaN(parsed)) {
      setIndexInput(String(config.index))
      return
    }
    // Clamp to valid range
    const clamped = Math.min(Math.max(0, parsed), totalConfigs - 1)
    setIndexInput(String(clamped))
    if (clamped !== config.index) {
      onIndexChange(config.id, clamped)
    }
  }

  const timeout = config.timeoutMs != null
    ? `${config.timeoutMs}ms`
    : `${globalTimeoutMs}ms (global)`

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 items-start">
      {/* Priority index input */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <label className="text-xs text-muted">Priority</label>
        <input
          type="number"
          value={indexInput}
          onChange={e => setIndexInput(e.target.value)}
          onBlur={handleIndexBlur}
          className="w-14 text-center border border-gray-200 rounded-lg px-2 py-1.5 text-sm font-mono"
        />
      </div>

      {/* Main content */}
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${statusDot[config.status]}`} />
          <h3 className="font-medium text-sm text-primary truncate">
            {config.label}
          </h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ml-auto shrink-0 ${statusColors[config.status]}`}>
            {config.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-secondary">
          <span><span className="text-muted">Provider</span> {config.provider}</span>
          <span><span className="text-muted">Model</span> {config.model}</span>
          <span><span className="text-muted">Family</span> {config.family}</span>
          <span><span className="text-muted">Version</span> {config.version}</span>
          <span className="col-span-2 font-mono truncate">
            <span className="text-muted">URL</span> {config.baseUrl}
          </span>
          <span><span className="text-muted">Timeout</span> {timeout}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 shrink-0">
        <button
          onClick={() => onEdit(config)}
          className="text-xs border border-gray-200 text-secondary px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Edit
        </button>
        {confirmDelete ? (
          <div className="flex flex-col gap-1">
            <button
              onClick={() => onDelete(config.id)}
              className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs border border-gray-200 text-secondary px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-xs border border-red-200 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}