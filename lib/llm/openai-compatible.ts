import { LLMConfig } from '@/types'
import { LLMAdapter, AnalysisInput } from './index'
import { resolveTimeout } from './configs'

export class OpenAICompatibleAdapter implements LLMAdapter {
  private config: LLMConfig

  constructor(config: LLMConfig) {
    this.config = config
  }

  async analyzeConversation(input: AnalysisInput) {
    const { title, prefs, existingTopics } = input
    const timeout = resolveTimeout(this.config)

    const prompt = `Based on my Claude conversation titled "${title}", what are 3-5 topics I should study?

Infer from the title what the conversation was likely about and identify knowledge gaps a user in that conversation probably has.

User preferences:
- Default tier: ${prefs.defaultTier}
- Categories of interest: ${prefs.categories.join(', ')}
- Already known topics (exclude these): ${existingTopics.join(', ') || 'none'}

Return only valid JSON. No preamble, no markdown, no code blocks.

Schema:
{
  "topics": [
    {
      "title": string,
      "description": string (2 sentences max),
      "tier": 1 | 2 | 3,
      "category": string,
      "prerequisites": string[]
    }
  ]
}`

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey
            ? { Authorization: `Bearer ${this.config.apiKey}` }
            : {})
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        }),
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`)
      }

      const data = await response.json()
      const text = data.choices?.[0]?.message?.content ?? ''
      const clean = text.replace(/```json\n?|\n?```/g, '').trim()
      const parsed = JSON.parse(clean)
      return parsed.topics

    } finally {
      clearTimeout(timer)
    }
  }
}