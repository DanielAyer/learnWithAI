import { DBAdapter } from './index'
import { TopicCard, Conversation, UserPrefs, AnalysisQueueItem } from '@/types'

// TODO: Implement PostgresAdapter for Vercel hosted deployment
// All methods currently throw to prevent silent failures in production
// until the implementation is complete.

export class PostgresAdapter implements DBAdapter {
  getConversations(): Conversation[] {
    throw new Error('PostgresAdapter not yet implemented')
  }

  upsertConversation(_conversation: Conversation): void {
    throw new Error('PostgresAdapter not yet implemented')
  }

  deleteConversation(_id: string): void {
    throw new Error('PostgresAdapter not yet implemented')
  }

  getTopicCards(): TopicCard[] {
    throw new Error('PostgresAdapter not yet implemented')
  }

  getTopicCardsByConversation(_conversationId: string): TopicCard[] {
    throw new Error('PostgresAdapter not yet implemented')
  }

  getQueuedCards(): TopicCard[] {
    throw new Error('PostgresAdapter not yet implemented')
  }

  upsertTopicCard(_card: TopicCard): void {
    throw new Error('PostgresAdapter not yet implemented')
  }

  updateCardStatus(_id: string, _status: TopicCard['status']): void {
    throw new Error('PostgresAdapter not yet implemented')
  }

  updateCardTutorialUrl(_id: string, _tutorialUrl: string | null): void {
    throw new Error('PostgresAdapter not yet implemented')
  }

  deleteCardsByConversation(_conversationId: string): void {
    throw new Error('PostgresAdapter not yet implemented')
  }

  getAnalysisQueue(): AnalysisQueueItem[] {
    throw new Error('PostgresAdapter not yet implemented')
  }

  addToAnalysisQueue(_item: AnalysisQueueItem): void {
    throw new Error('PostgresAdapter not yet implemented')
  }

  updateAnalysisQueueItem(_item: AnalysisQueueItem): void {
    throw new Error('PostgresAdapter not yet implemented')
  }

  removeFromAnalysisQueue(_id: string): void {
    throw new Error('PostgresAdapter not yet implemented')
  }

  clearAnalysisQueue(): void {
    throw new Error('PostgresAdapter not yet implemented')
  }

  reorderAnalysisQueue(_ids: string[]): void {
    throw new Error('PostgresAdapter not yet implemented')
  }

  getUserPrefs(): UserPrefs | null {
    throw new Error('PostgresAdapter not yet implemented')
  }

  saveUserPrefs(_prefs: UserPrefs): void {
    throw new Error('PostgresAdapter not yet implemented')
  }
}