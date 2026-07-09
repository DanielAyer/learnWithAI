export type Tier = 1 | 2 | 3

export type Category = string

export type CardStatus = 'untouched' | 'queued' | 'learned'

export type ConversationStatus = 'unanalyzed' | 'analyzed' | 'ignored'

export type AnalysisMode = 'guided' | 'strict'

export type LLMProvider =
  | 'Anthropic'
  | 'OpenAI'
  | 'Ollama'
  | 'Groq'
  | 'Mistral'
  | 'Custom'

export type LLMStatus = 'untested' | 'connected' | 'failed'

export interface LLMConfig {
  index: number
  id: string
  label: string
  provider: LLMProvider
  family: string
  version: string
  baseUrl: string
  apiKey: string
  model: string
  timeoutMs: number | null
  status: LLMStatus
}

export interface LLMConfigStore {
  globalTimeoutMs: number
  activeIndex: number
  configs: LLMConfig[]
}

export interface AnalysisOverrides {
  mode?: AnalysisMode
  categories?: Category[]
  maxCards?: number
}

export interface TopicCard {
  id: string
  title: string
  description: string
  tier: Tier
  category: Category
  prerequisites: string[]
  sourceConversationIds: string[]
  status: CardStatus
  createdAt: string
  llmId: string
  llmLabel: string
  tutorialUrl: string | null
}

export interface Conversation {
  id: string
  title: string
  updatedAt: string
  messageCount?: number
  status: ConversationStatus
  summary?: string
}

export interface UserPrefs {
  defaultTier: Tier
  categories: Category[]
  analysisMode: AnalysisMode
  maxCards: number
}