'use client'

import { TopicCard } from '@/types'

interface Props {
  card: TopicCard
  onStatusChange: (id: string, status: TopicCard['status']) => void
}

const tierLabels = { 1: 'Surface', 2: 'Mechanism', 3: 'Substrate' }
const tierColors = {
  1: 'bg-blue-50 text-blue-600',
  2: 'bg-purple-50 text-purple-600',
  3: 'bg-red-50 text-red-600'
}
const statusColors = {
  untouched: 'bg-gray-100 text-gray-500',
  reading: 'bg-yellow-50 text-yellow-600',
  learned: 'bg-green-50 text-green-700'
}
const statusNext: Record<TopicCard['status'], TopicCard['status']> = {
  untouched: 'reading',
  reading: 'learned',
  learned: 'untouched'
}
const statusNextLabel = {
  untouched: 'Start Reading',
  reading: 'Mark Learned',
  learned: 'Reset'
}

export default function TopicCardComponent({ card, onStatusChange }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-sm leading-snug text-gray-900">
          {card.title}
        </h3>
        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${tierColors[card.tier]}`}>
          {tierLabels[card.tier]}
        </span>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        {card.description}
      </p>

      {card.prerequisites.length > 0 && (
        <div className="text-xs text-gray-400">
          <span className="font-medium">Prereqs: </span>
          {card.prerequisites.join(', ')}
        </div>
      )}

      <div className="text-xs text-gray-400">
        {card.category}
      </div>

      {card.llmLabel && (
        <div className="font-mono text-xs text-gray-300">
          {card.llmLabel}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto">
        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[card.status]}`}>
          {card.status}
        </span>
        <button
          onClick={() => onStatusChange(card.id, statusNext[card.status])}
          className="text-xs border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {statusNextLabel[card.status]}
        </button>
      </div>
    </div>
  )
}