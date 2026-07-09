'use client'

import { useEffect, useState, useMemo } from 'react'
import { TopicCard, Tier, Category } from '@/types'
import TopicCardComponent from '@/components/TopicCard'
import FilterBar, { FilterState } from '@/components/FilterBar'

const DEFAULT_FILTERS: FilterState = {
  tier: 'all',
  category: 'all',
  status: 'all',
  sort: 'newest'
}

export default function TopicsPage() {
  const [cards, setCards] = useState<TopicCard[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)

  useEffect(() => {
    async function fetchCards() {
      const res = await fetch('/api/topics')
      const data = await res.json()
      setCards(data.cards ?? [])
      setLoading(false)
    }
    fetchCards()
  }, [])

  async function handleStatusChange(cardId: string, status: TopicCard['status']) {
    await fetch('/api/topics', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cardId, status })
    })
    setCards(prev =>
      prev.map(c => c.id === cardId ? { ...c, status } : c)
    )
  }

  const filteredCards = useMemo(() => {
    let result = [...cards]

    // Filter by tier
    if (filters.tier !== 'all') {
      result = result.filter(c => c.tier === filters.tier)
    }

    // Filter by category
    if (filters.category !== 'all') {
      result = result.filter(c => c.category === filters.category)
    }

    // Filter by status
    if (filters.status !== 'all') {
      result = result.filter(c => c.status === filters.status)
    }

    // Sort
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
  }, [cards, filters])

  if (loading) {
    return <p className="text-secondary">Loading topics...</p>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">All Topics</h1>
      </div>

      <FilterBar
        filters={filters}
        onChange={setFilters}
        totalCount={cards.length}
        filteredCount={filteredCards.length}
      />

      {filteredCards.length === 0 ? (
        <div className="text-center py-16 text-muted">
          {cards.length === 0 ? (
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
  )
}