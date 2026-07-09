import { NextResponse } from 'next/server'
import { getDB } from '@/lib/db'
import { UserPrefs } from '@/types'

export async function GET() {
  try {
    const db = await getDB()
    const prefs = db.getUserPrefs()
    return NextResponse.json({ prefs })
  } catch (error) {
    console.error('Error fetching preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const db = await getDB()
    const prefs: UserPrefs = await request.json()
    db.saveUserPrefs(prefs)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving preferences:', error)
    return NextResponse.json(
      { error: 'Failed to save preferences' },
      { status: 500 }
    )
  }
}