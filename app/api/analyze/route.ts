import { NextResponse } from 'next/server'
import { getDB } from '@/lib/db'
import { getLLM } from '@/lib/llm'
import { v4 as uuidv4 } from 'uuid'
import { TopicCard } from '@/types'

export async function POST(request: Request) {
  try {
    const db = await getDB()
    const { conversationId, title } = await request.json()

    // Get user prefs for analysis parameters
    const prefs = db.getUserPrefs() ?? {
      defaultTier: 1,
      categories: ['Programming & Software Dev']
    }

    // Get already learned topics to exclude
    const existingCards = db.getTopicCards()
    const learnedTopics = existingCards
      .filter(c => c.status === 'learned')
      .map(c => c.title)

    // TODO: CONVERSATIONS_API
    // When Anthropic exposes GET /v1/conversations, the title parameter
    // should be replaced with a full summary fetched directly here.
    // Suggested: const summary = await client.conversations.get(conversationId).summary
    // Privacy note: only accessible for conversations user has flagged as API-accessible

    // Get LLM with failover support
    const { adapter, config } = await getLLM()

    // Call LLM for analysis
    const topics = await adapter.analyzeConversation({
      conversationId,
      title,
      prefs,
      existingTopics: learnedTopics
    })

    // Persist cards — tag each with which LLM generated them
    const cards: TopicCard[] = topics.map((topic: any) => ({
      id: uuidv4(),
      ...topic,
      sourceConversationIds: [conversationId],
      status: 'untouched' as const,
      createdAt: new Date().toISOString(),
      llmId: config.id,
      llmLabel: config.label
    }))

    for (const card of cards) {
      db.upsertTopicCard(card)
    }

    // Mark conversation as analyzed
    const conversations = db.getConversations()
    const conversation = conversations.find(c => c.id === conversationId)
    if (conversation) {
      db.upsertConversation({ ...conversation, status: 'analyzed' })
    }

    return NextResponse.json({ cards })

  } catch (error) {
    console.error('Error analyzing conversation:', error)
    return NextResponse.json(
      { error: 'Failed to analyze conversation' },
      { status: 500 }
    )
  }
}