import { NextResponse } from 'next/server'
import { readConfigStore, writeConfigStore } from '@/lib/llm/configs'
import { LLMConfig, LLMConfigStore } from '@/types'
import { v4 as uuidv4 } from 'uuid'

// GET — return full config store
export async function GET() {
  try {
    const store = readConfigStore()
    return NextResponse.json(store)
  } catch (error) {
    console.error('Error reading LLM configs:', error)
    return NextResponse.json(
      { error: 'Failed to read LLM configurations' },
      { status: 500 }
    )
  }
}

// POST — add a new LLM config
export async function POST(request: Request) {
  try {
    const store = readConfigStore()
    const body = await request.json()

    const newConfig: LLMConfig = {
      index: store.configs.length,
      id: uuidv4(),
      label: body.label,
      provider: body.provider,
      family: body.family,
      version: body.version,
      baseUrl: body.baseUrl,
      apiKey: body.apiKey ?? '',
      model: body.model,
      timeoutMs: body.timeoutMs ?? null,
      status: 'untested'
    }

    store.configs.push(newConfig)
    writeConfigStore(store)

    return NextResponse.json(newConfig)
  } catch (error) {
    console.error('Error adding LLM config:', error)
    return NextResponse.json(
      { error: 'Failed to add LLM configuration' },
      { status: 500 }
    )
  }
}

// PATCH — update configs (reorder, edit, set active, update global timeout)
export async function PATCH(request: Request) {
  try {
    const store = readConfigStore()
    const body = await request.json()

    // Update global timeout
    if (body.globalTimeoutMs !== undefined) {
      store.globalTimeoutMs = body.globalTimeoutMs
    }

    // Set active index
    if (body.activeIndex !== undefined) {
      store.activeIndex = body.activeIndex
    }

    // Update a single config
    if (body.config) {
      const idx = store.configs.findIndex(c => c.id === body.config.id)
      if (idx !== -1) {
        store.configs[idx] = { ...store.configs[idx], ...body.config }
      }
    }

    // Reorder — accept a full reordered configs array
    if (body.configs) {
      // Clamp all indexes to valid range
      const total = body.configs.length
      store.configs = body.configs.map((c: LLMConfig, i: number) => ({
        ...c,
        index: Math.min(Math.max(0, c.index), total - 1)
      }))
      // Re-sort by index and reassign sequential indexes
      store.configs.sort((a, b) => a.index - b.index)
      store.configs = store.configs.map((c, i) => ({ ...c, index: i }))
    }

    // Update status of a config (after test connection)
    if (body.id && body.status) {
      const idx = store.configs.findIndex(c => c.id === body.id)
      if (idx !== -1) {
        store.configs[idx].status = body.status
      }
    }

    writeConfigStore(store)
    return NextResponse.json(store)

  } catch (error) {
    console.error('Error updating LLM configs:', error)
    return NextResponse.json(
      { error: 'Failed to update LLM configurations' },
      { status: 500 }
    )
  }
}

// DELETE — remove a config by id
export async function DELETE(request: Request) {
  try {
    const store = readConfigStore()
    const { id } = await request.json()

    store.configs = store.configs
      .filter(c => c.id !== id)
      .map((c, i) => ({ ...c, index: i }))

    // Reset activeIndex if it's out of bounds
    if (store.activeIndex >= store.configs.length) {
      store.activeIndex = 0
    }

    writeConfigStore(store)
    return NextResponse.json(store)

  } catch (error) {
    console.error('Error deleting LLM config:', error)
    return NextResponse.json(
      { error: 'Failed to delete LLM configuration' },
      { status: 500 }
    )
  }
}