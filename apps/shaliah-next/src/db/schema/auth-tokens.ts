import { pgTable, uuid, text, timestamp, boolean, index } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// Auth tokens table for Ezer bot authentication linking
export const authTokens = pgTable('auth_tokens', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  token: text('token').notNull().unique(), // 32-char alphanumeric token
  userId: uuid('user_id').notNull(), // References auth.users(id) - FK added in migration
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(), // 15 minutes after creation
  usedAt: timestamp('used_at', { withTimezone: true }), // NULL = unused, timestamp = used
  isActive: boolean('is_active').notNull().default(true), // Soft delete flag
}, (table) => ({
  tokenIdx: index('idx_auth_tokens_token').on(table.token),
  userIdIdx: index('idx_auth_tokens_user_id').on(table.userId),
  expiresAtIdx: index('idx_auth_tokens_expires_at').on(table.expiresAt).where(sql`${table.isActive} = true`),
}))