'use client'

import { useEffect, useState } from 'react'
import { TopicCard } from '@/types'

export default function QueuePage() {
  const [cards, setCards] = useState<TopicCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQueue()
  }, [])

  async function fetchQueue() {
    const res = await fetch('/api/topics?queued=true')
    const data = await res.json()
    setCards(data.cards ?? [])
    setLoading(false)
  }

  async function handleStatusChange(cardId: string, status: TopicCard['status']) {
    await fetch('/api/topics', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cardId, status })
    })
    if (status === 'learned') {
      setCards(prev => prev.filter(c => c.id !== cardId))
    } else {
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, status } : c))
    }
  }

  async function handleTutorialUrlChange(cardId: string, url: string) {
    await fetch('/api/topics', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cardId, tutorialUrl: url || null })
    })
    setCards(prev =>
      prev.map(c => c.id === cardId ? { ...c, tutorialUrl: url || null } : c)
    )
  }

  if (loading) {
    return <p className="text-gray-500">Loading queue...</p>
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-sm">Your queue is empty.</p>
        <p className="text-xs mt-1">Add topics from the Topics page to get started.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Learning Queue</h1>
        <span className="text-sm text-gray-500">{cards.length} topics</span>
      </div>

      <div className="flex flex-col gap-4">
        {cards.map(card => (
          <div key={card.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1">
                <h3 className="font-medium text-sm text-gray-900">{card.title}</h3>
                <span className="text-xs text-gray-400">{card.category}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                card.tier === 1 ? 'bg-blue-50 text-blue-600' :
                card.tier === 2 ? 'bg-purple-50 text-purple-600' :
                'bg-red-50 text-red-600'
              }`}>
                {card.tier === 1 ? 'Surface' : card.tier === 2 ? 'Mechanism' : 'Substrate'}
              </span>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-500 leading-relaxed">
              {card.description}
            </p>

            {/* Prerequisites */}
            {card.prerequisites.length > 0 && (
              <div className="text-xs text-gray-400">
                <span className="font-medium">Prereqs: </span>
                {card.prerequisites.join(', ')}
              </div>
            )}

            {/* Tutorial URL */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Tutorial URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  defaultValue={card.tutorialUrl ?? ''}
                  onBlur={e => handleTutorialUrlChange(card.id, e.target.value)}
                  placeholder="Paste tutorial URL..."
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-mono"
                />
                {card.tutorialUrl && (
                    <a
                    href={card.tutorialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors shrink-0"
                  >
                    Open →
                  </a>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-1">
              {/* TODO: TUTORIAL_SEARCH
                  Replace this Google search stub with a real tutorial search integration.
                  Suggested: Google Custom Search API filtered to known free/paid platforms.
                  Free platforms: YouTube, freeCodeCamp, Khan Academy, MIT OpenCourseWare
                  Paid platforms: Udemy, Coursera, LinkedIn Learning, Pluralsight
                  Classify results by matching domain against platform lists.
                  Return 2 free + 2 paid suggestions per topic. */}
              
                <a href={`https://www.google.com/search?q=Learn+${encodeURIComponent(card.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-orange-500 hover:text-orange-600 transition-colors"
              >
                Find tutorials →
              </a>

              <button
                onClick={() => handleStatusChange(card.id, 'learned')}
                className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors"
              >
                Mark Learned
              </button>
            </div>

            {/* LLM badge */}
            {card.llmLabel && (
              <div className="font-mono text-xs text-gray-300">
                {card.llmLabel}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}