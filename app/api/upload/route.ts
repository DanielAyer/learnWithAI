import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

// TODO: CONVERSATIONS_API
// This upload route exists solely because no conversations API endpoint exists.
// Remove entirely once GET /v1/conversations is available.

const EXPORT_PATH = path.join(process.cwd(), 'data', 'claude-export.json')

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!file.name.endsWith('.json')) {
      return NextResponse.json(
        { error: 'File must be a JSON export from claude.ai' },
        { status: 400 }
      )
    }

    const text = await file.text()

    // Validate it looks like a Claude export before saving
    const parsed = JSON.parse(text)
    if (!parsed.conversations && !Array.isArray(parsed)) {
      return NextResponse.json(
        { error: 'File does not appear to be a Claude export' },
        { status: 400 }
      )
    }

    fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true })
    fs.writeFileSync(EXPORT_PATH, text, 'utf-8')

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error uploading export:', error)
    return NextResponse.json(
      { error: 'Failed to process export file' },
      { status: 500 }
    )
  }
}