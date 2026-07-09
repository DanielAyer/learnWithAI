'use client'

import { useEffect, useState, useMemo } from 'react'
import { TopicCard } from '@/types'
import TopicCardComponent from '@/components/TopicCard'
import TierBadge from '@/components/TierBadge'
import CategoryBadge from '@/components/CategoryBadge'
import FilterBar, { FilterState } from '@/components/FilterBar'

const DEFAULT_FILTERS: FilterState = {
  tier: 'all',
  category: 'all',
  status: 'all',
  sort: 'newest'
}

export default function LearnPage() {
  const [queuedCards, setQueuedCards] = useState<TopicCard[]>([])
  const [allCards, setAllCards] = useState<TopicCard[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)

  useEffect(() => {
    fetchCards()
  }, [])

  async function fetchCards() {
    const [queuedRes, allRes] = await Promise.all([
      fetch('/api/topics?queued=true'),
      fetch('/api/topics')
    ])
    const queuedData = await queuedRes.json()
    const allData = await allRes.json()
    setQueuedCards(queuedData.cards ?? [])
    setAllCards(allData.cards ?? [])
    setLoading(false)
  }

  async function handleStatusChange(cardId: string, status: TopicCard['status']) {
    await fetch('/api/topics', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cardId, status })
    })
    await fetchCards()
  }

  async function handleTutorialUrlChange(cardId: string, url: string) {
    await fetch('/api/topics', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cardId, tutorialUrl: url || null })
    })
    setQueuedCards(prev =>
      prev.map(c => c.id === cardId ? { ...c, tutorialUrl: url || null } : c)
    )
  }

  const filteredCards = useMemo(() => {
    let result = [...allCards]

    if (filters.tier !== 'all') {
      result = result.filter(c => c.tier === filters.tier)
    }
    if (filters.category !== 'all') {
      result = result.filter(c => c.category === filters.category)
    }
    if (filters.status !== 'all') {
      result = result.filter(c => c.status === filters.status)
    }

    switch (filters.sort) {
      case 'newest':
        result.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        break
      case 'oldest':
        result.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        break
      case 'tier-asc':
        result.sort((a, b) => a.tier - b.tier)
        break
      case 'tier-desc':
        result.sort((a, b) => b.tier - a.tier)
        break
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title))
        break
    }

    return result
  }, [allCards, filters])

  if (loading) return <p className="text-secondary">Loading...</p>

  return (
    <div>
      {/* ── In Queue ── */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">In Queue</h2>
          <span className="text-sm text-muted">{queuedCards.length} topics</span>
        </div>

        {queuedCards.length === 0 ? (
          <div className="text-center py-10 text-muted border border-dashed border-gray-200 rounded-xl">
            <p className="text-sm">Your learning queue is empty.</p>
            <p className="text-xs mt-1">Add topics from the Recommended section below.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {queuedCards.map(card => (
              <div key={card.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-sm text-primary">{card.title}</h3>
                  <TierBadge tier={card.tier} />
                </div>
                <CategoryBadge category={card.category} />
                <p className="text-xs text-secondary leading-relaxed">{card.description}</p>
                {card.prerequisites.length > 0 && (
                  <div className="text-xs text-muted">
                    <span className="font-medium">Prereqs: </span>
                    {card.prerequisites.join(', ')}
                  </div>
                )}

                {/* Tutorial URL */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-secondary">Tutorial URL</label>
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
                        className="text-xs bg-gray-100 text-secondary px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors shrink-0"
                      >
                        Open →
                      </a>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto">
                  <a
                    href={`https://www.google.com/search?q=Learn+${encodeURIComponent(card.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-orange-500 hover:text-orange-600 transition-colors"
                  >
                    Find tutorials →
                  </a>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusChange(card.id, 'untouched')}
                      className="text-xs border border-gray-200 text-secondary px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Remove
                    </button>
                    <button
                      onClick={() => handleStatusChange(card.id, 'learned')}
                      className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Mark Learned
                    </button>
                  </div>
                </div>

                {card.llmLabel && (
                  <div className="font-mono text-xs text-muted">{card.llmLabel}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 mb-10" />

      {/* ── Recommended ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recommended</h2>
        </div>

        <FilterBar
          filters={filters}
          onChange={setFilters}
          totalCount={allCards.length}
          filteredCount={filteredCards.length}
        />

        {filteredCards.length === 0 ? (
          <div className="text-center py-16 text-muted">
            {allCards.length === 0 ? (
              <>
                <p className="text-sm">No topics yet.</p>
                <p className="text-xs mt-1">Analyze some conversations to get started.</p>
              </>
            ) : (
              <>
                <p className="text-sm">No topics match your filters.</p>
                <p className="text-xs mt-1">Try adjusting or resetting the filters.</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCards.map(card => (
              <TopicCardComponent
                key={card.id}
                card={card}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}