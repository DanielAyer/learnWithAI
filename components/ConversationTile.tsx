'use client'

import { Conversation } from '@/types'
import Link from 'next/link'

interface Props {
  conversation: Conversation
  onStatusChange: (id: string, status: Conversation['status']) => void
}

const statusColors = {
  unanalyzed: 'bg-gray-100 text-secondary',
  analyzed: 'bg-green-100 text-green-700',
  ignored: 'bg-red-50 text-red-400'
}

export default function ConversationTile({ conversation, onStatusChange }: Props) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 ${conversation.status === 'ignored' ? 'opacity-50' : ''}`}>
      {/* Title + status */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-sm leading-snug line-clamp-2 text-primary">
          {conversation.title}
        </h3>
        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusColors[conversation.status]}`}>
          {conversation.status}
        </span>
      </div>

      {/* Metadata */}
      <div className="text-xs text-muted">
        {new Date(conversation.updatedAt).toLocaleDateString()}
        {conversation.messageCount ? ` · ${conversation.messageCount} messages` : ''}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
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
            className="text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors"
          >
            {conversation.status === 'analyzed' ? 'Reanalyze' : 'Analyze Conversation'}
          </Link>
        )}

        <button
          onClick={() => onStatusChange(conversation.id, conversation.status === 'ignored' ? 'unanalyzed' : 'ignored')}
          className="text-xs border border-gray-200 text-secondary px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {conversation.status === 'ignored' ? 'Unignore' : 'Ignore'}
        </button>
      </div>
    </div>
  )
}