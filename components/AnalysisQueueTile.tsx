'use client'

import { useState } from 'react'
import { AnalysisQueueItem, AnalysisMode } from '@/types'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import CategoryCombobox from './CategoryCombobox'

interface Props {
  item: AnalysisQueueItem
  onDelete: (id: string) => void
  onUpdate: (item: AnalysisQueueItem) => void
  onRunNow: (id: string) => void
  isRunning?: boolean
}

export default function AnalysisQueueTile({ item, onDelete, onUpdate, isRunning }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [mode, setMode] = useState<AnalysisMode>(item.mode)
  const [maxCards, setMaxCards] = useState(item.maxCards)
  const [categories, setCategories] = useState<string[]>(item.categories)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  function handleSave() {
    onUpdate({ ...item, mode, maxCards, categories })
    setExpanded(false)
  }

  function handleCancel() {
    setMode(item.mode)
    setMaxCards(item.maxCards)
    setCategories(item.categories)
    setExpanded(false)
  }

  const statusColors = {
    pending: 'bg-gray-100 text-secondary',
    complete: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-600'
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border border-gray-200 rounded-xl overflow-hidden ${
        isDragging ? 'shadow-lg' : ''
      } ${item.status === 'complete' ? 'opacity-60' : ''}`}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 p-4">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="text-muted hover:text-secondary cursor-grab active:cursor-grabbing shrink-0 touch-none"
          disabled={isRunning}
        >
          ⠿
        </button>

        {/* Content */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => !isRunning && item.status === 'pending' && setExpanded(prev => !prev)}
        >
          <p className="text-sm font-medium text-primary truncate">{item.title}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-muted capitalize">{item.mode}</span>
            <span className="text-xs text-muted">·</span>
            <span className="text-xs text-muted">{item.maxCards} topics</span>
            <span className="text-xs text-muted">·</span>
            <span className="text-xs text-muted">{item.categories.length} categories</span>
            {item.llmLabel && (
              <>
                <span className="text-xs text-muted">·</span>
                <span className="font-mono text-xs text-muted">{item.llmLabel}</span>
              </>
            )}
          </div>
        </div>

        {/* Status + delete */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[item.status]}`}>
            {item.status}
          </span>
          {!isRunning && item.status === 'pending' && (
            confirmDelete ? (
              <div className="flex gap-1">
                <button
                  onClick={() => onDelete(item.id)}
                  className="text-xs bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs border border-gray-200 text-secondary px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex gap-1">
                <button
                  onClick={() => onRunNow(item.id)}
                  className="text-xs bg-orange-500 text-white px-2 py-1 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Run Now
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="text-xs border border-red-200 text-red-400 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Remove
                </button>
              </div>
            )
          )}
        </div>
      </div>

      {/* Expanded settings */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 flex flex-col gap-4 bg-gray-50/50">
          <p className="text-xs text-muted">Click tile to collapse. Changes apply only to this queue item.</p>

          {/* Mode */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-secondary">Mode</label>
            <div className="flex gap-2">
              {(['guided', 'strict'] as AnalysisMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors capitalize ${
                    mode === m
                      ? 'border-orange-300 bg-orange-50 text-orange-700'
                      : 'border-gray-200 text-secondary hover:bg-gray-50'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Max cards */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-secondary">Topics to generate</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={10}
                value={maxCards}
                onChange={e => setMaxCards(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-xs font-mono text-center"
              />
              <span className="text-xs text-muted">max 10</span>
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-secondary">Categories</label>
            <CategoryCombobox
              selected={categories}
              onChange={setCategories}
            />
          </div>

          {/* Save/Cancel */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancel}
              className="text-xs border border-gray-200 text-secondary px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  )
}