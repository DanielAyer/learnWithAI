import { LLMConfig, UserPrefs } from '@/types'

export interface AnalysisInput {
  conversationId: string
  title: string
  prefs: UserPrefs
  existingTopics: string[]
}

export interface AnalysisOutput {
  title: string
  description: string
  tier: 1 | 2 | 3
  category: string
  prerequisites: string[]
}

export interface LLMAdapter {
  analyzeConversation(input: AnalysisInput): Promise<AnalysisOutput[]>
}

export async function getLLM(): Promise<{
  adapter: LLMAdapter
  config: LLMConfig
}> {
  const { getLLMWithFailover } = await import('./configs')
  return getLLMWithFailover()
}