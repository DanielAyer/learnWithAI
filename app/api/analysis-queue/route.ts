import { NextResponse } from 'next/server'
import { getDB } from '@/lib/db'
import { AnalysisQueueItem } from '@/types'
import { v4 as uuidv4 } from 'uuid'

// GET — return full analysis queue
export async function GET() {
  try {
    const db = await getDB()
    const queue = db.getAnalysisQueue()
    return NextResponse.json({ queue })
  } catch (error) {
    console.error('Error fetching analysis queue:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analysis queue' },
      { status: 500 }
    )
  }
}

// POST — add a conversation to the queue
export async function POST(request: Request) {
  try {
    const db = await getDB()
    const body = await request.json()
    const queue = db.getAnalysisQueue()

    // Get active LLM label
    const { readConfigStore } = await import('@/lib/llm/configs')
    const store = readConfigStore()
    const activeConfig = store.configs[store.activeIndex] ?? store.configs[0]
    const llmLabel = activeConfig?.label ?? 'Unknown LLM'

    const item: AnalysisQueueItem = {
      id: uuidv4(),
      conversationId: body.conversationId,
      title: body.title,
      position: queue.length,
      mode: body.mode ?? 'guided',
      maxCards: body.maxCards ?? 5,
      categories: body.categories ?? [],
      queuedAt: new Date().toISOString(),
      status: 'pending',
      llmLabel
    }

    db.addToAnalysisQueue(item)
    return NextResponse.json({ item })

  } catch (error) {
    console.error('Error adding to analysis queue:', error)
    return NextResponse.json(
      { error: 'Failed to add to analysis queue' },
      { status: 500 }
    )
  }
}

// PATCH — update item, reorder queue, or mark status
export async function PATCH(request: Request) {
  try {
    const db = await getDB()
    const body = await request.json()

    // Reorder
    if (body.ids) {
      db.reorderAnalysisQueue(body.ids)
      return NextResponse.json({ queue: db.getAnalysisQueue() })
    }

    // Update a single item
    if (body.item) {
      db.updateAnalysisQueueItem(body.item)
      return NextResponse.json({ queue: db.getAnalysisQueue() })
    }

    // Update status of a single item by id
    if (body.id && body.status) {
      const queue = db.getAnalysisQueue()
      const item = queue.find(i => i.id === body.id)
      if (item) {
        db.updateAnalysisQueueItem({ ...item, status: body.status })
      }
      return NextResponse.json({ queue: db.getAnalysisQueue() })
    }

    return NextResponse.json(
      { error: 'Invalid PATCH body' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error updating analysis queue:', error)
    return NextResponse.json(
      { error: 'Failed to update analysis queue' },
      { status: 500 }
    )
  }
}

// DELETE — remove one item or clear entire queue
export async function DELETE(request: Request) {
  try {
    const db = await getDB()
    const body = await request.json()

    if (body.clear) {
      db.clearAnalysisQueue()
    } else if (body.id) {
      db.removeFromAnalysisQueue(body.id)
      // Reorder remaining items
      const remaining = db.getAnalysisQueue()
      db.reorderAnalysisQueue(remaining.map(i => i.id))
    }

    return NextResponse.json({ queue: db.getAnalysisQueue() })

  } catch (error) {
    console.error('Error deleting from analysis queue:', error)
    return NextResponse.json(
      { error: 'Failed to delete from analysis queue' },
      { status: 500 }
    )
  }
}