'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { TopicCard } from '@/types'
import TopicCardComponent from '@/components/TopicCard'
import Link from 'next/link'

export default function ConversationDetailPage() {
  const { id } = useParams()
  const [cards, setCards] = useState<TopicCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCards() {
      const res = await fetch(`/api/topics?conversationId=${id}`)
      const data = await res.json()
      setCards(data.cards ?? [])
      setLoading(false)
    }
    fetchCards()
  }, [id])

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
    return <p className="text-secondary">Loading topics...</p>
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/conversations"
          className="text-sm text-muted hover:text-secondary transition-colors"
        >
          ← Conversations
        </Link>
      </div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Topics</h1>
        <span className="text-sm text-secondary">{cards.length} topics</span>
      </div>
      {cards.length === 0 ? (
        <p className="text-secondary">No topics found for this conversation.</p>
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