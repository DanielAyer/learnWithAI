import { TopicCard, Conversation, UserPrefs, AnalysisQueueItem } from '@/types'

export interface DBAdapter {
  // Conversations
  getConversations(): Conversation[]
  upsertConversation(conversation: Conversation): void
  deleteConversation(id: string): void

  // Topic Cards
  getTopicCards(): TopicCard[]
  getTopicCardsByConversation(conversationId: string): TopicCard[]
  getQueuedCards(): TopicCard[]
  upsertTopicCard(card: TopicCard): void
  updateCardStatus(id: string, status: TopicCard['status']): void
  updateCardTutorialUrl(id: string, tutorialUrl: string | null): void
  deleteCardsByConversation(conversationId: string): void

  // Analysis Queue
  getAnalysisQueue(): AnalysisQueueItem[]
  addToAnalysisQueue(item: AnalysisQueueItem): void
  updateAnalysisQueueItem(item: AnalysisQueueItem): void
  removeFromAnalysisQueue(id: string): void
  clearAnalysisQueue(): void
  reorderAnalysisQueue(ids: string[]): void

  // User Preferences
  getUserPrefs(): UserPrefs | null
  saveUserPrefs(prefs: UserPrefs): void
}

let adapter: DBAdapter | undefined

export async function getDB(): Promise<DBAdapter> {
  if (adapter) return adapter as DBAdapter

  if (process.env.NODE_ENV === 'production') {
    const { PostgresAdapter } = await import('./postgres')
    adapter = new PostgresAdapter()
  } else {
    const { SQLiteAdapter } = await import('./sqlite')
    adapter = new SQLiteAdapter()
  }

  return adapter as DBAdapter
}