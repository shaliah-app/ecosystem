import { pgTable, serial, uuid, text, varchar, bigint, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Existing table (keeping for now)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  fullName: text('full_name'),
  phone: varchar('phone', { length: 256 }),
});

// New authentication-related tables
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().references(() => authUsers.id, { onDelete: 'cascade' }),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  language: varchar('language', { length: 10 }).default('pt-BR').notNull(),
  activeSpaceId: uuid('active_space_id'),
  telegramUserId: bigint('telegram_user_id', { mode: 'number' }).unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Reference to Supabase auth.users table
export const authUsers = pgTable('auth.users', {
  id: uuid('id').primaryKey(),
  email: text('email'),
  rawUserMetaData: text('raw_user_meta_data'),
});

// Re-export magic link attempts schema
export { magicLinkAttempts } from './schema/magic-link-attempts';