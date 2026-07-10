'use client'

import { useEffect, useState } from 'react'
import { Conversation } from '@/types'
import ConversationTile from '@/components/ConversationTile'
import Link from 'next/link'

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [needsExport, setNeedsExport] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showQueueModal, setShowQueueModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [queueing, setQueueing] = useState(false)
  const [pastedTitle, setPastedTitle] = useState('')
  const [addError, setAddError] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchConversations()
  }, [])

  async function fetchConversations() {
    setLoading(true)
    const res = await fetch('/api/conversations')
    const data = await res.json()
    setConversations(data.conversations ?? [])
    setNeedsExport(data.needsExport ?? false)
    setLoading(false)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    if (res.ok) {
      await fetchConversations()
      setShowAddModal(false)
    } else {
      setAddError('Upload failed — make sure this is a Claude export JSON file.')
    }
    setUploading(false)
  }

  async function handleAddByTitle() {
    if (!pastedTitle.trim()) {
      setAddError('Please enter a conversation title.')
      return
    }

    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: pastedTitle.trim() })
    })

    if (res.ok) {
      await fetchConversations()
      setPastedTitle('')
      setShowAddModal(false)
      setAddError('')
    } else {
      setAddError('Failed to add conversation.')
    }
  }

  async function handleQueueWithDefaults(id: string) {
    const conversation = conversations.find(c => c.id === id)
    if (!conversation) return

    const prefsRes = await fetch('/api/preferences')
    const prefsData = await prefsRes.json()
    const prefs = prefsData.prefs

    await fetch('/api/analysis-queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: id,
        title: conversation.title,
        mode: prefs?.analysisMode ?? 'guided',
        maxCards: prefs?.maxCards ?? 5,
        categories: prefs?.categories ?? []
      })
    })
  }

  async function handleStatusChange(id: string, status: Conversation['status']) {
    await fetch('/api/conversations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    })
    setConversations(prev =>
      prev.map(c => c.id === id ? { ...c, status } : c)
    )
  }

  async function handleDelete(id: string) {
    await fetch('/api/conversations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    setConversations(prev => prev.filter(c => c.id !== id))
  }

  async function handleQueueSelected() {
    setQueueing(true)
    setShowQueueModal(false)

    const prefsRes = await fetch('/api/preferences')
    const prefsData = await prefsRes.json()
    const prefs = prefsData.prefs

    const toQueue = selected.size > 0
      ? conversations.filter(c => selected.has(c.id))
      : conversations.filter(c => c.status !== 'ignored')

    for (const conv of toQueue) {
      await fetch('/api/analysis-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conv.id,
          title: conv.title,
          mode: prefs?.analysisMode ?? 'guided',
          maxCards: prefs?.maxCards ?? 5,
          categories: prefs?.categories ?? []
        })
      })
    }

    setSelected(new Set())
    setQueueing(false)
    window.location.href = '/analyze-queue'
  }

  function handleToggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  
  const unanalyzedCount = conversations.filter(c => c.status === 'unanalyzed').length

  if (loading) {
    return <p className="text-secondary">Loading conversations...</p>
  }

  if (needsExport && conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h2 className="text-xl font-semibold mb-2">Import your Claude conversations</h2>
        <p className="text-secondary max-w-md mb-6">
          Export your data from <strong>claude.ai → Settings → Privacy → Export Data</strong>,
          then upload the <code>conversations.json</code> file here.
        </p>
        <label className="bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors cursor-pointer">
          {uploading ? 'Uploading...' : 'Upload conversations.json'}
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>
    )
  }

  return (
    <div className="pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Conversations</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">{conversations.length} total</span>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-sm bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            + Add
          </button>
          <button
            onClick={() => setShowQueueModal(true)}
            disabled={queueing || conversations.length === 0}
            className="text-sm bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-40 font-medium"
          >
            {queueing ? 'Queuing...' : selected.size > 0 ? `Queue Selected (${selected.size})` : 'Queue All'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {conversations.map(conv => (
          <ConversationTile
            key={conv.id}
            conversation={conv}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            selected={selected.has(conv.id)}
            onToggleSelect={handleToggleSelect}
          />
        ))}
      </div>

      {/* Analyze button — sticky bottom, aligned with tile grid */}
      <div className="flex justify-end mt-6">
        <Link
          href="/analyze-queue"
          style={{ position: 'sticky', bottom: '24px' }}
          className="bg-orange-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-orange-600 transition-colors font-medium text-sm"
        >
          Analyze →
        </Link>
      </div>

      {/* Queue modal */}
      {showQueueModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Queue Conversations</h2>
            <p className="text-secondary text-sm">
              Add conversations to the analysis queue using your global preferences.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleQueueSelected()}
                className="w-full py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
              >
                Queue All ({conversations.filter(c => c.status !== 'ignored').length} conversations)
              </button>
              <button
                onClick={() => handleQueueSelected()}
                disabled={unanalyzedCount === 0}
                className="w-full py-3 border border-gray-200 text-secondary rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-40"
              >
                Queue Remaining ({unanalyzedCount} unanalyzed)
              </button>
            </div>
            <button
              onClick={() => setShowQueueModal(false)}
              className="text-sm text-muted hover:text-secondary transition-colors text-center"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add Conversations modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div
            className="bg-white rounded-2xl shadow-xl p-6 flex flex-col gap-4"
            style={{ width: 'fit-content', minWidth: '380px' }}
          >
            <h2 className="text-lg font-semibold">Add Conversation</h2>

            {/* TODO: CONVERSATIONS_API
                Replace manual entry with a direct API call to fetch conversation list.
                Each LLM provider will have a different endpoint:
                  Anthropic: GET /v1/conversations (requested, not yet available)
                  OpenAI: no public conversation API currently
                  Local (Ollama): no conversation history API
                When available, this modal should offer "Import from [Provider]"
                as a one-click alternative to manual entry. */}

            {/* Paste content */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-secondary">
                  Type or paste conversation content below
                </label>
                <span className={`text-xs ${pastedTitle.length > 350 ? 'text-orange-500' : 'text-muted'}`}>
                  {pastedTitle.length} / 400
                </span>
              </div>
              <textarea
                value={pastedTitle}
                onChange={e => {
                  const val = e.target.value.slice(0, 400)
                  setPastedTitle(val)
                  setAddError('')
                }}
                onBlur={e => setPastedTitle(e.target.value.trimEnd())}
                placeholder="e.g. Setting up Docker on Ubuntu..."
                rows={3}
                maxLength={400}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm resize min-h-[80px] max-h-[400px] w-full"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-sm font-medium text-primary">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* File upload */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-secondary">
                Upload conversations.json export
              </label>
              <label className="border border-dashed border-gray-300 rounded-lg px-4 py-6 text-center cursor-pointer hover:bg-gray-50 transition-colors">
                <span className="text-xs text-muted">
                  {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                </span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </label>
            </div>

            {addError && (
              <p className="text-xs text-red-500">{addError}</p>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setPastedTitle('')
                  setAddError('')
                }}
                className="text-sm border border-gray-200 text-secondary px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddByTitle}
                disabled={!pastedTitle.trim()}
                className="text-sm bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-40 font-medium"
              >
                Add Conversation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}