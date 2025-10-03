import { pgTable, serial, text, timestamp, boolean, inet } from "drizzle-orm/pg-core";

export const magicLinkAttempts = pgTable('magic_link_attempts', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  attemptedAt: timestamp('attempted_at').defaultNow().notNull(),
  ipAddress: inet('ip_address'),
  success: boolean('success').default(true).notNull(),
});