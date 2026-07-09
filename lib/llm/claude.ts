import Anthropic from '@anthropic-ai/sdk'
import { LLMConfig } from '@/types'
import { LLMAdapter, AnalysisInput } from './index'
import { resolveTimeout } from './configs'

export class ClaudeAdapter implements LLMAdapter {
  private client: Anthropic
  private config: LLMConfig

  constructor(config: LLMConfig) {
    this.config = config
    this.client = new Anthropic({
      apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY,
      baseURL: config.baseUrl
    })
  }

  async analyzeConversation(input: AnalysisInput) {
    const { title, prefs, existingTopics, overrides } = input

    // Resolve effective settings — overrides take precedence over prefs
    const mode = overrides?.mode ?? prefs.analysisMode ?? 'guided'
    const categories = overrides?.categories ?? prefs.categories
    const maxCards = overrides?.maxCards ?? prefs.maxCards ?? 5

    // TODO: CARD_COUNT_LIMIT
    // Current cap is 10 due to quality degradation with title-only analysis.
    // Revisit when GET /v1/conversations is available and full conversation
    // content can be sent, providing enough signal for higher card counts.
    const clampedMaxCards = Math.min(Math.max(1, maxCards), 10)

    const categoryInstruction = mode === 'strict'
      ? `You MUST only return topics that fall within these categories: ${categories.join(', ')}. If the conversation does not surface enough topics in these categories, return fewer cards rather than topics outside them.`
      : `The user is interested in these categories: ${categories.join(', ')}. Use these as a guide but return whatever topics are most relevant to the conversation.`

    const prompt = `Based on my Claude conversation titled "${title}", what are ${clampedMaxCards} topics I should study?

Infer from the title what the conversation was likely about and identify knowledge gaps a user in that conversation probably has.

${categoryInstruction}

Analysis mode: ${mode === 'strict' ? 'STRICT — only return topics within the specified categories' : 'GUIDED — use categories as context, return most relevant topics'}

Already known topics (exclude these): ${existingTopics.join(', ') || 'none'}

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

    const timeout = resolveTimeout(this.config)
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
      let topics = parsed.topics

      // Post-filter for strict mode as a safety net
      if (mode === 'strict') {
        topics = topics.filter((t: any) =>
          categories.some(cat =>
            cat.toLowerCase() === t.category.toLowerCase()
          )
        )
      }

      return topics

    } finally {
      clearTimeout(timer)
    }
  }
}