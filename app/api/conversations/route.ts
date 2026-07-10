import { NextResponse } from 'next/server'
import { getDB } from '@/lib/db'
import { Conversation } from '@/types'
import path from 'path'
import fs from 'fs'

// TODO: CONVERSATIONS_API
// This entire file should be replaceable with a direct API call once
// Anthropic exposes GET /v1/conversations.
// Suggested implementation:
//   const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
//   const response = await client.conversations.list({ limit: 50 })
//   const conversations = response.data.map(conv => ({
//     id: conv.id,
//     title: conv.title ?? 'Untitled',
//     updatedAt: conv.updated_at,
//     status: 'unanalyzed'
//   }))
// Privacy note: endpoint should only return conversations the user has
// explicitly flagged as accessible to third-party API calls in claude.ai settings.
// This would make the data export flow below entirely unnecessary.

const EXPORT_PATH = path.join(process.cwd(), 'data', 'claude-export.json')

function parseExport(raw: any): Conversation[] {
  // TODO: CONVERSATIONS_API
  // This parser exists only because no conversations API endpoint exists.
  // Remove entirely once GET /v1/conversations is available.
  // When available, fetch only: id, title, updated_at — no message content.

  const list = Array.isArray(raw) ? raw : raw.conversations ?? []

  return list
    .filter((conv: any) => conv.name?.trim())
    .map((conv: any) => ({
      id: conv.uuid,
      title: conv.name.trim(),
      updatedAt: conv.updated_at ?? conv.created_at,
      messageCount: conv.chat_messages?.length ?? 0,
      status: 'unanalyzed' as const
    }))
}

export async function GET() {
  try {
    const db = await getDB()

    if (!fs.existsSync(EXPORT_PATH)) {
      return NextResponse.json({
        conversations: db.getConversations(),
        needsExport: true
      })
    }

    const raw = JSON.parse(fs.readFileSync(EXPORT_PATH, 'utf-8'))
    const parsed = parseExport(raw)

    const stored = db.getConversations()
    const storedIds = new Set(stored.map(c => c.id))

    for (const conv of parsed) {
      if (!storedIds.has(conv.id)) {
        db.upsertConversation(conv)
      }
    }

    return NextResponse.json({
      conversations: db.getConversations(),
      needsExport: false
    })

  } catch (error) {
    console.error('Error loading conversations:', error)
    return NextResponse.json(
      { error: 'Failed to load conversations' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const db = await getDB()
    const { title } = await request.json()

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const { v4: uuidv4 } = await import('uuid')

    const conversation: Conversation = {
      id: uuidv4(),
      title: title.trim(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
      status: 'unanalyzed'
    }

    db.upsertConversation(conversation)
    return NextResponse.json({ conversation })

  } catch (error) {
    console.error('Error adding conversation:', error)
    return NextResponse.json(
      { error: 'Failed to add conversation' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const db = await getDB()
    const { id, status } = await request.json()

    const conversations = db.getConversations()
    const conversation = conversations.find(c => c.id === id)

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    db.upsertConversation({ ...conversation, status })
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error updating conversation:', error)
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const db = await getDB()
    const { id } = await request.json()

    // Delete conversation and all associated topic cards
    db.deleteCardsByConversation(id)
    db.deleteConversation(id)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting conversation:', error)
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    )
  }
}