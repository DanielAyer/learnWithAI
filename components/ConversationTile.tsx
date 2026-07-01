'use client'

import { useState } from 'react'
import { Conversation } from '@/types'
import Link from 'next/link'

interface Props {
  conversation: Conversation
  onStatusChange: (id: string, status: Conversation['status']) => void
  onAnalyze: (id: string) => Promise<void>
}

export default function ConversationTile({ conversation, onStatusChange, onAnalyze }: Props) {
  const [analyzing, setAnalyzing] = useState(false)

  const statusColors = {
    unanalyzed: 'bg-gray-100 text-gray-600',
    analyzed: 'bg-green-100 text-green-700',
    ignored: 'bg-red-50 text-red-400'
  }

  async function handleAnalyze() {
    setAnalyzing(true)
    await onAnalyze(conversation.id)
    setAnalyzing(false)
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 ${conversation.status === 'ignored' ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-sm leading-snug line-clamp-2 text-gray-900">
          {conversation.title}
        </h3>
        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusColors[conversation.status]}`}>
          {conversation.status}
        </span>
      </div>

      <div className="text-xs text-gray-400">
        {new Date(conversation.updatedAt).toLocaleDateString()}
        {conversation.messageCount ? ` · ${conversation.messageCount} messages` : ''}
      </div>

      <div className="flex gap-2 mt-auto">
        {conversation.status === 'analyzed' ? (
          <Link
            href={`/conversations/${conversation.id}`}
            className="text-xs bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors"
          >
            View Topics →
          </Link>
        ) : (
          <button
            onClick={handleAnalyze}
            disabled={conversation.status === 'ignored' || analyzing}
            className="text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-40"
          >
            {analyzing ? 'Analyzing...' : 'Analyze'}
          </button>
        )}
        <button
          onClick={() => onStatusChange(conversation.id, conversation.status === 'ignored' ? 'unanalyzed' : 'ignored')}
          className="text-xs border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {conversation.status === 'ignored' ? 'Unignore' : 'Ignore'}
        </button>
      </div>
    </div>
  )
}