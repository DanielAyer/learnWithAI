'use client'

import { useState } from 'react'
import { Conversation } from '@/types'
import Link from 'next/link'

interface Props {
  conversation: Conversation
  onStatusChange: (id: string, status: Conversation['status']) => void
  onDelete: (id: string) => void
  selected: boolean
  onToggleSelect: (id: string) => void
}

const statusColors = {
  unanalyzed: 'bg-gray-100 text-secondary',
  analyzed: 'bg-green-100 text-green-700',
  ignored: 'bg-red-50 text-red-400'
}

export default function ConversationTile({ conversation, onStatusChange, onDelete, selected, onToggleSelect }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div
      onClick={() => conversation.status !== 'ignored' && onToggleSelect(conversation.id)}
      className={`border rounded-xl p-4 flex flex-col gap-3 min-h-[160px] transition-all cursor-pointer
        ${conversation.status === 'ignored' ? 'opacity-50 cursor-not-allowed' : ''}
        ${selected 
          ? 'bg-gray-200 border-orange-400 shadow-inner' 
          : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm hover:shadow'}
      `}
    >
      {/* Title + status + checkmark */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-sm leading-snug line-clamp-2 text-primary">
          {conversation.title}
        </h3>
        <div className="flex items-center gap-1.5 shrink-0">
          {selected && (
            <span className="text-xs text-orange-500 font-medium">✓</span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[conversation.status]}`}>
            {conversation.status}
          </span>
        </div>
      </div>

      {/* Metadata */}
      <div className="text-xs text-muted">
        {new Date(conversation.updatedAt).toLocaleDateString()}
        {conversation.messageCount ? ` · ${conversation.messageCount} messages` : ''}
      </div>

      {/* Primary actions */}
      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
        {conversation.status === 'analyzed' && (
          <Link
            href={`/conversations/${conversation.id}`}
            className="text-xs bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors"
          >
            View Topics →
          </Link>
        )}
        {conversation.status !== 'ignored' && (
          <Link
            href={`/analyze/${conversation.id}`}
            className="text-xs border border-gray-200 text-secondary px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Settings
          </Link>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100"
        onClick={e => e.stopPropagation()}
      >
        {confirmDelete ? (
          <div className="flex gap-1">
            <button
              onClick={() => onDelete(conversation.id)}
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
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-xs border border-red-200 text-red-400 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        )}

        <button
          onClick={() => onStatusChange(conversation.id, conversation.status === 'ignored' ? 'unanalyzed' : 'ignored')}
          className="text-xs border border-gray-200 text-secondary px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {conversation.status === 'ignored' ? 'Unignore' : 'Ignore'}
        </button>
      </div>
    </div>
  )
}