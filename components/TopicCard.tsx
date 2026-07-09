'use client'

import { TopicCard } from '@/types'

interface Props {
  card: TopicCard
  onStatusChange: (id: string, status: TopicCard['status']) => void
  showQueueButton?: boolean
}

const tierLabels = { 1: 'Surface', 2: 'Mechanism', 3: 'Substrate' }
const tierColors = {
  1: 'bg-blue-50 text-blue-600',
  2: 'bg-purple-50 text-purple-600',
  3: 'bg-red-50 text-red-600'
}
const statusColors = {
  untouched: '',
  queued: 'bg-yellow-50 text-yellow-600',
  learned: 'bg-green-50 text-green-700'
}

export default function TopicCardComponent({ card, onStatusChange, showQueueButton = true }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
      {/* Title + tier badge */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-sm leading-snug text-primary">
          {card.title}
        </h3>
        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${tierColors[card.tier]}`}>
          {tierLabels[card.tier]}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-secondary leading-relaxed">
        {card.description}
      </p>

      {/* Prerequisites */}
      {card.prerequisites.length > 0 && (
        <div className="text-xs text-muted">
          <span className="font-medium">Prereqs: </span>
          {card.prerequisites.join(', ')}
        </div>
      )}

      {/* Category */}
      <div className="text-xs text-muted">
        {card.category}
      </div>

      {/* LLM badge */}
      {card.llmLabel && (
        <div className="font-mono text-xs text-muted">
          {card.llmLabel}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-1">
        {card.status !== 'untouched' && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[card.status]}`}>
            {card.status}
          </span>
        )}

        <div className="flex gap-2 ml-auto">
          {card.status === 'untouched' && (
            <button
              onClick={() => onStatusChange(card.id, 'queued')}
              className="text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Add to Queue
            </button>
          )}

          {card.status === 'queued' && (
            <>
              <button
                onClick={() => onStatusChange(card.id, 'untouched')}
                className="text-xs border border-gray-200 text-secondary px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Remove
              </button>
              <button
                onClick={() => onStatusChange(card.id, 'learned')}
                className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors"
              >
                Learned
              </button>
            </>
          )}

          {card.status === 'learned' && (
            <span className="text-xs text-green-600 font-medium">
              ✓ Learned
            </span>
          )}
        </div>
      </div>
    </div>
  )
}