import { NextResponse } from 'next/server'
import { getDB } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const db = await getDB()
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    const cards = conversationId
      ? db.getTopicCardsByConversation(conversationId)
      : db.getTopicCards()

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
    const { id, status } = await request.json()

    db.updateCardStatus(id, status)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error updating topic status:', error)
    return NextResponse.json(
      { error: 'Failed to update topic' },
      { status: 500 }
    )
  }
}