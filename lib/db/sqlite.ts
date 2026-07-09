import Database from 'better-sqlite3'
import path from 'path'
import { TopicCard, Conversation, UserPrefs, AnalysisQueueItem } from '@/types'
import { DBAdapter } from './index'

const DB_PATH = path.join(process.cwd(), 'data', 'learn.db')

export class SQLiteAdapter implements DBAdapter {
  private db: Database.Database

  constructor() {
    const fs = require('fs')
    fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true })
    this.db = new Database(DB_PATH)
    this.init()
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        messageCount INTEGER,
        status TEXT NOT NULL DEFAULT 'unanalyzed'
      );

      CREATE TABLE IF NOT EXISTS topic_cards (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        tier INTEGER NOT NULL,
        category TEXT NOT NULL,
        prerequisites TEXT NOT NULL DEFAULT '[]',
        sourceConversationIds TEXT NOT NULL DEFAULT '[]',
        status TEXT NOT NULL DEFAULT 'untouched',
        createdAt TEXT NOT NULL,
        llmId TEXT NOT NULL DEFAULT '',
        llmLabel TEXT NOT NULL DEFAULT '',
        tutorialUrl TEXT DEFAULT NULL
      );

      CREATE TABLE IF NOT EXISTS analysis_queue (
        id TEXT PRIMARY KEY,
        conversationId TEXT NOT NULL,
        title TEXT NOT NULL,
        position INTEGER NOT NULL DEFAULT 0,
        mode TEXT NOT NULL DEFAULT 'guided',
        maxCards INTEGER NOT NULL DEFAULT 5,
        categories TEXT NOT NULL DEFAULT '[]',
        queuedAt TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending'
      );

      CREATE TABLE IF NOT EXISTS user_prefs (
        id INTEGER PRIMARY KEY DEFAULT 1,
        defaultTier INTEGER NOT NULL DEFAULT 1,
        categories TEXT NOT NULL DEFAULT '[]',
        analysisMode TEXT NOT NULL DEFAULT 'guided',
        maxCards INTEGER NOT NULL DEFAULT 5
      );
    `)

    // Migrate existing databases
    const topicColumns = this.db.prepare(`PRAGMA table_info(topic_cards)`).all() as any[]
    const topicColumnNames = topicColumns.map(c => c.name)

    if (!topicColumnNames.includes('llmId')) {
      this.db.exec(`ALTER TABLE topic_cards ADD COLUMN llmId TEXT NOT NULL DEFAULT ''`)
    }
    if (!topicColumnNames.includes('llmLabel')) {
      this.db.exec(`ALTER TABLE topic_cards ADD COLUMN llmLabel TEXT NOT NULL DEFAULT ''`)
    }
    if (!topicColumnNames.includes('tutorialUrl')) {
      this.db.exec(`ALTER TABLE topic_cards ADD COLUMN tutorialUrl TEXT DEFAULT NULL`)
    }

    const prefsColumns = this.db.prepare(`PRAGMA table_info(user_prefs)`).all() as any[]
    const prefsColumnNames = prefsColumns.map(c => c.name)

    if (!prefsColumnNames.includes('analysisMode')) {
      this.db.exec(`ALTER TABLE user_prefs ADD COLUMN analysisMode TEXT NOT NULL DEFAULT 'guided'`)
    }
    if (!prefsColumnNames.includes('maxCards')) {
      this.db.exec(`ALTER TABLE user_prefs ADD COLUMN maxCards INTEGER NOT NULL DEFAULT 5`)
    }
  }

  // Conversations
  getConversations(): Conversation[] {
    return this.db.prepare('SELECT * FROM conversations ORDER BY updatedAt DESC').all() as Conversation[]
  }

  upsertConversation(conversation: Conversation): void {
    this.db.prepare(`
      INSERT INTO conversations (id, title, updatedAt, messageCount, status)
      VALUES (@id, @title, @updatedAt, @messageCount, @status)
      ON CONFLICT(id) DO UPDATE SET
        title = @title,
        updatedAt = @updatedAt,
        messageCount = @messageCount,
        status = @status
    `).run(conversation)
  }

  deleteConversation(id: string): void {
    this.db.prepare('DELETE FROM conversations WHERE id = ?').run(id)
  }

  // Topic Cards
  getTopicCards(): TopicCard[] {
    const rows = this.db.prepare('SELECT * FROM topic_cards ORDER BY createdAt DESC').all() as any[]
    return rows.map(this.deserializeCard)
  }

  getTopicCardsByConversation(conversationId: string): TopicCard[] {
    const rows = this.db.prepare('SELECT * FROM topic_cards').all() as any[]
    return rows
      .map(this.deserializeCard)
      .filter(card => card.sourceConversationIds.includes(conversationId))
  }

  getQueuedCards(): TopicCard[] {
    const rows = this.db.prepare(
      `SELECT * FROM topic_cards WHERE status = 'queued' ORDER BY createdAt DESC`
    ).all() as any[]
    return rows.map(this.deserializeCard)
  }

  upsertTopicCard(card: TopicCard): void {
    this.db.prepare(`
      INSERT INTO topic_cards (
        id, title, description, tier, category,
        prerequisites, sourceConversationIds, status,
        createdAt, llmId, llmLabel, tutorialUrl
      )
      VALUES (
        @id, @title, @description, @tier, @category,
        @prerequisites, @sourceConversationIds, @status,
        @createdAt, @llmId, @llmLabel, @tutorialUrl
      )
      ON CONFLICT(id) DO UPDATE SET
        title = @title,
        description = @description,
        tier = @tier,
        category = @category,
        prerequisites = @prerequisites,
        sourceConversationIds = @sourceConversationIds,
        status = @status,
        llmId = @llmId,
        llmLabel = @llmLabel,
        tutorialUrl = @tutorialUrl
    `).run({
      ...card,
      prerequisites: JSON.stringify(card.prerequisites),
      sourceConversationIds: JSON.stringify(card.sourceConversationIds)
    })
  }

  updateCardStatus(id: string, status: TopicCard['status']): void {
    this.db.prepare('UPDATE topic_cards SET status = ? WHERE id = ?').run(status, id)
  }

  updateCardTutorialUrl(id: string, tutorialUrl: string | null): void {
    this.db.prepare('UPDATE topic_cards SET tutorialUrl = ? WHERE id = ?').run(tutorialUrl, id)
  }

  deleteCardsByConversation(conversationId: string): void {
    const cards = this.getTopicCardsByConversation(conversationId)
    for (const card of cards) {
      this.db.prepare('DELETE FROM topic_cards WHERE id = ?').run(card.id)
    }
  }

  // Analysis Queue
  getAnalysisQueue(): AnalysisQueueItem[] {
    const rows = this.db.prepare(
      'SELECT * FROM analysis_queue ORDER BY position ASC'
    ).all() as any[]
    return rows.map(row => ({
      ...row,
      categories: JSON.parse(row.categories)
    }))
  }

  addToAnalysisQueue(item: AnalysisQueueItem): void {
    this.db.prepare(`
      INSERT INTO analysis_queue (
        id, conversationId, title, position, mode,
        maxCards, categories, queuedAt, status
      )
      VALUES (
        @id, @conversationId, @title, @position, @mode,
        @maxCards, @categories, @queuedAt, @status
      )
      ON CONFLICT(id) DO UPDATE SET
        position = @position,
        mode = @mode,
        maxCards = @maxCards,
        categories = @categories,
        status = @status
    `).run({
      ...item,
      categories: JSON.stringify(item.categories)
    })
  }

  updateAnalysisQueueItem(item: AnalysisQueueItem): void {
    this.db.prepare(`
      UPDATE analysis_queue SET
        position = @position,
        mode = @mode,
        maxCards = @maxCards,
        categories = @categories,
        status = @status
      WHERE id = @id
    `).run({
      ...item,
      categories: JSON.stringify(item.categories)
    })
  }

  removeFromAnalysisQueue(id: string): void {
    this.db.prepare('DELETE FROM analysis_queue WHERE id = ?').run(id)
  }

  clearAnalysisQueue(): void {
    this.db.prepare('DELETE FROM analysis_queue').run()
  }

  reorderAnalysisQueue(ids: string[]): void {
    const update = this.db.prepare(
      'UPDATE analysis_queue SET position = ? WHERE id = ?'
    )
    const reorder = this.db.transaction((ids: string[]) => {
      ids.forEach((id, index) => update.run(index, id))
    })
    reorder(ids)
  }

  // User Preferences
  getUserPrefs(): UserPrefs | null {
    const row = this.db.prepare('SELECT * FROM user_prefs WHERE id = 1').get() as any
    if (!row) return null
    return {
      defaultTier: row.defaultTier,
      categories: JSON.parse(row.categories),
      analysisMode: row.analysisMode ?? 'guided',
      maxCards: row.maxCards ?? 5
    }
  }

  saveUserPrefs(prefs: UserPrefs): void {
    this.db.prepare(`
      INSERT INTO user_prefs (id, defaultTier, categories, analysisMode, maxCards)
      VALUES (1, @defaultTier, @categories, @analysisMode, @maxCards)
      ON CONFLICT(id) DO UPDATE SET
        defaultTier = @defaultTier,
        categories = @categories,
        analysisMode = @analysisMode,
        maxCards = @maxCards
    `).run({
      defaultTier: prefs.defaultTier,
      categories: JSON.stringify(prefs.categories),
      analysisMode: prefs.analysisMode,
      maxCards: prefs.maxCards
    })
  }

  private deserializeCard(row: any): TopicCard {
    return {
      ...row,
      prerequisites: JSON.parse(row.prerequisites),
      sourceConversationIds: JSON.parse(row.sourceConversationIds),
      tutorialUrl: row.tutorialUrl ?? null
    }
  }
}