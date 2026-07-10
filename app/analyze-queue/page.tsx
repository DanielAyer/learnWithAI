'use client'

import { useEffect, useState } from 'react'
import { AnalysisQueueItem } from '@/types'
import AnalysisQueueTile from '@/components/AnalysisQueueTile'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable'

export default function AnalyzeQueuePage() {
  const [queue, setQueue] = useState<AnalysisQueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState<{ current: number, total: number } | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [currentTitle, setCurrentTitle] = useState<string>('')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  useEffect(() => {
    fetchQueue()
  }, [])

  async function fetchQueue() {
    const res = await fetch('/api/analysis-queue')
    const data = await res.json()
    setQueue(data.queue ?? [])
    setLoading(false)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = queue.findIndex(i => i.id === active.id)
    const newIndex = queue.findIndex(i => i.id === over.id)
    const reordered = arrayMove(queue, oldIndex, newIndex)
    setQueue(reordered)

    await fetch('/api/analysis-queue', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: reordered.map(i => i.id) })
    })
  }

  async function handleDelete(id: string) {
    await fetch('/api/analysis-queue', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    setQueue(prev => prev.filter(i => i.id !== id))
  }

  async function handleRunNow(id: string) {
    const item = queue.find(i => i.id === id)
    if (!item) return

    setRunning(true)
    setProgress({ current: 1, total: 1 })

    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: item.conversationId,
        title: item.title,
        overrides: {
          mode: item.mode,
          maxCards: item.maxCards,
          categories: item.categories
        }
      })
    })

    const status = res.ok ? 'complete' : 'failed'
    await fetch('/api/analysis-queue', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, status })
    })

    setQueue(prev =>
      prev.map(q => q.id === id ? { ...q, status } : q)
    )

    setRunning(false)
    setProgress(null)
  }

  async function handleUpdate(item: AnalysisQueueItem) {
    await fetch('/api/analysis-queue', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item })
    })
    setQueue(prev => prev.map(i => i.id === item.id ? item : i))
  }

  async function handleClear() {
    await fetch('/api/analysis-queue', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clear: true })
    })
    setQueue([])
    setShowClearConfirm(false)
  }

  async function handleRunQueue() {
    const pending = queue.filter(i => i.status === 'pending')
    if (pending.length === 0) return

    setRunning(true)
    setProgress({ current: 0, total: pending.length })

    for (let i = 0; i < pending.length; i++) {
      const item = pending[i]
      setProgress({ current: i + 1, total: pending.length })
      setCurrentTitle(item.title)

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: item.conversationId,
          title: item.title,
          overrides: {
            mode: item.mode,
            maxCards: item.maxCards,
            categories: item.categories
          }
        })
      })

      const status = res.ok ? 'complete' : 'failed'
      await fetch('/api/analysis-queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, status })
      })

      setQueue(prev =>
        prev.map(q => q.id === item.id ? { ...q, status } : q)
      )
    }

    setRunning(false)
    setProgress(null)
  }

  const pendingCount = queue.filter(i => i.status === 'pending').length

  if (loading) return <p className="text-secondary">Loading queue...</p>

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Analysis Queue</h1>
          <p className="text-xs text-muted mt-1">
            {pendingCount} pending · {queue.length} total
          </p>
        </div>
        <div className="flex gap-2">
          {queue.length > 0 && !running && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="text-xs border border-gray-200 text-secondary px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear All
            </button>
          )}
          <button
            onClick={handleRunQueue}
            disabled={running || pendingCount === 0}
            className="text-sm bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-40 font-medium"
          >
            {running && progress
              ? `Analyzing "${currentTitle}" (${progress.current} of ${progress.total})...`
              : `Run Queue (${pendingCount})`}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {/* TODO: STATUS_ACCURACY
        Progress bar advances per API call completion, not per token processed.
        For short conversations the bar jumps instantly; for long ones it appears
        stuck then jumps. A more accurate indicator would stream token progress
        from the API response. Consider using Anthropic's streaming API in a
        future release to provide real-time progress updates per analysis call. */
      }
      
      {running && progress && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between text-xs text-secondary mb-2">
            <span>Analyzing Conversation...</span>
            <span>{progress.current} / {progress.total}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Empty state */}
      {queue.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="text-sm">No conversations queued for analysis.</p>
          <p className="text-xs mt-1">
            Go to Conversations and click "Analyze Conversation" to add items.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={queue.map(i => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-3">
              {queue.map(item => (
                <AnalysisQueueTile
                key={item.id}
                item={item}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                onRunNow={handleRunNow}
                isRunning={running}
              />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Clear confirm modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Clear Queue</h2>
            <p className="text-secondary text-sm">
              Remove all {queue.length} items from the analysis queue? This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="text-sm border border-gray-200 text-secondary px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClear}
                className="text-sm bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}