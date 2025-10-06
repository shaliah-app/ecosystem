import { pgTable, uuid, text, timestamp, bigint, index } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// User profiles table extending Supabase auth.users
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull().unique(), // References auth.users(id) - FK added in migration
  fullName: text('full_name'), // User's display name
  language: text('language').notNull().default('en-US'), // User language preference
  telegramUserId: bigint('telegram_user_id', { mode: 'number' }).unique(), // Telegram user ID (64-bit)
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_user_profiles_user_id').on(table.userId),
  telegramUserIdIdx: index('idx_user_profiles_telegram_user_id').on(table.telegramUserId),
}))