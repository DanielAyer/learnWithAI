import Anthropic from '@anthropic-ai/sdk'
import { LLMConfig } from '@/types'
import { LLMAdapter, AnalysisInput } from './index'
import { resolveTimeout } from './configs'

export class ClaudeAdapter implements LLMAdapter {
  private client: Anthropic
  private config: LLMConfig

  constructor(config: LLMConfig) {
  this.config = config
  console.log('Claude adapter init, key prefix:', config.apiKey?.slice(0, 10))
  this.client = new Anthropic({
    apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY,
    baseURL: config.baseUrl
  })
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
      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      }, { signal: controller.signal })

      const text = response.content
        .filter(block => block.type === 'text')
        .map(block => block.type === 'text' ? block.text : '')
        .join('')

      const clean = text.replace(/```json\n?|\n?```/g, '').trim()
      const parsed = JSON.parse(clean)
      return parsed.topics

    } finally {
      clearTimeout(timer)
    }
  }
}