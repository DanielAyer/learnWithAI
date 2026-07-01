import { NextResponse } from 'next/server'
import { LLMConfig } from '@/types'

async function testAnthropic(config: LLMConfig): Promise<void> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({
    apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY,
    baseURL: config.baseUrl
  })

  await client.messages.create({
    model: config.model,
    max_tokens: 10,
    messages: [{ role: 'user', content: 'Reply with OK.' }]
  })
}

async function testOpenAICompatible(config: LLMConfig): Promise<void> {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.apiKey
        ? { Authorization: `Bearer ${config.apiKey}` }
        : {})
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Reply with OK.' }]
    })
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`)
  }
}

export async function POST(request: Request) {
  try {
    const config: LLMConfig = await request.json()
    const timeout = config.timeoutMs ?? 30000

    const testPromise = config.provider === 'Anthropic'
      ? testAnthropic(config)
      : testOpenAICompatible(config)

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Connection timed out')), timeout)
    )

    await Promise.race([testPromise, timeoutPromise])

    return NextResponse.json({ success: true, status: 'connected' })

  } catch (error: any) {
    console.error('LLM test connection failed:', error)
    return NextResponse.json(
      { success: false, status: 'failed', error: error.message },
      { status: 200 }
    )
  }
}