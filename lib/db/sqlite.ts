import Database from 'better-sqlite3'
import path from 'path'
import { TopicCard, Conversation, UserPrefs } from '@/types'
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

      CREATE TABLE IF NOT EXISTS user_prefs (
        id INTEGER PRIMARY KEY DEFAULT 1,
        defaultTier INTEGER NOT NULL DEFAULT 1,
        categories TEXT NOT NULL DEFAULT '[]'
      );
    `)

    // Migrate existing databases
    const columns = this.db.prepare(`PRAGMA table_info(topic_cards)`).all() as any[]
    const columnNames = columns.map(c => c.name)

    if (!columnNames.includes('llmId')) {
      this.db.exec(`ALTER TABLE topic_cards ADD COLUMN llmId TEXT NOT NULL DEFAULT ''`)
    }
    if (!columnNames.includes('llmLabel')) {
      this.db.exec(`ALTER TABLE topic_cards ADD COLUMN llmLabel TEXT NOT NULL DEFAULT ''`)
    }
    if (!columnNames.includes('tutorialUrl')) {
      this.db.exec(`ALTER TABLE topic_cards ADD COLUMN tutorialUrl TEXT DEFAULT NULL`)
    }
  }

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

  getUserPrefs(): UserPrefs | null {
    const row = this.db.prepare('SELECT * FROM user_prefs WHERE id = 1').get() as any
    if (!row) return null
    return {
      defaultTier: row.defaultTier,
      categories: JSON.parse(row.categories)
    }
  }

  saveUserPrefs(prefs: UserPrefs): void {
    this.db.prepare(`
      INSERT INTO user_prefs (id, defaultTier, categories)
      VALUES (1, @defaultTier, @categories)
      ON CONFLICT(id) DO UPDATE SET
        defaultTier = @defaultTier,
        categories = @categories
    `).run({
      defaultTier: prefs.defaultTier,
      categories: JSON.stringify(prefs.categories)
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