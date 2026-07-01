import { NextResponse } from 'next/server'
import { getDB } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const db = await getDB()
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    const queued = searchParams.get('queued')

    let cards
    if (queued === 'true') {
      cards = db.getQueuedCards()
    } else if (conversationId) {
      cards = db.getTopicCardsByConversation(conversationId)
    } else {
      cards = db.getTopicCards()
    }

    return NextResponse.json({ cards })

  } catch (error) {
    console.error('Error fetching topics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const db = await getDB()
    const body = await request.json()

    // Update status
    if (body.status !== undefined) {
      db.updateCardStatus(body.id, body.status)
    }

    // Update tutorial URL
    if (body.tutorialUrl !== undefined) {
      db.updateCardTutorialUrl(body.id, body.tutorialUrl)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error updating topic:', error)
    return NextResponse.json(
      { error: 'Failed to update topic' },
      { status: 500 }
    )
  }
}