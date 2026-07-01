'use client'

import { useEffect, useState } from 'react'
import { TopicCard } from '@/types'
import TopicCardComponent from '@/components/TopicCard'

export default function TopicsPage() {
  const [cards, setCards] = useState<TopicCard[]>([])
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return <p className="text-gray-500">Loading topics...</p>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">All Topics</h1>
        <span className="text-sm text-gray-500">{cards.length} total</span>
      </div>
      {cards.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">No topics yet.</p>
          <p className="text-xs mt-1">Analyze some conversations to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(card => (
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