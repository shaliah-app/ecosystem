# Data Model: Shaliah Authentication

**Date**: 2025-09-26  
**Status**: Completed

This document outlines the data structures required to support the Shaliah authentication feature, based on the feature specification and clarified requirements.

## 1. Core Entities

### 1.1. `auth.users` (Supabase Built-in)
This table is managed by Supabase Auth and serves as the primary source of truth for user identities. We will not modify its schema, but we will rely on it.

- **Key Fields**:
    - `id` (UUID): The primary key for a user. This is the cornerstone of all user-related data.
    - `email` (String): The user's primary email address.
    - `identities` (JSONB): An array of social identities linked to the user (e.g., Google).

### 1.2. `UserProfile` (Public Schema)
This table extends the `auth.users` table with public-facing profile information and application-specific settings.

- **Schema Definition (`apps/yesod-api/src/db/schema.ts`)**:
  ```typescript
  import { pgTable, text, uuid, bigint, timestamp } from 'drizzle-orm/pg-core';
  import { auth } from './auth'; // Assuming auth schema reference

  export const userProfiles = pgTable('UserProfile', {
    id: uuid('id').primaryKey().references(() => auth.users.id, { onDelete: 'cascade' }),
    fullName: text('full_name'),
    avatarUrl: text('avatar_url'),
    language: text('language').notNull().default('pt-BR'),
    activeSpaceId: uuid('active_space_id'), // Assuming a 'Spaces' table exists
    telegramUserId: bigint('telegram_user_id', { mode: 'number' }).unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  });
  ```

### 1.3. `AuthToken` (Public Schema)
This table stores short-lived, single-use tokens for securely linking sessions, such as connecting the Ezer Telegram bot.

- **Schema Definition (`apps/yesod-api/src/db/schema.ts`)**:
  ```typescript
  import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core';
  import { userProfiles } from './userProfile';

  export const authTokens = pgTable('AuthToken', {
    token: uuid('token').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => userProfiles.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at').notNull(),
  });
  ```

## 2. Relationships

- **`UserProfile` to `auth.users`**: A one-to-one relationship. Every `UserProfile` record corresponds to exactly one `auth.users` record, linked by the `id` field. The `onDelete: 'cascade'` ensures that if a user is deleted from `auth.users`, their corresponding `UserProfile` is automatically removed.
- **`AuthToken` to `UserProfile`**: A many-to-one relationship. A user can have multiple auth tokens generated for them over time (though typically only one valid at a time), but each token belongs to exactly one user.

## 3. Data Flow for Account Linking

The ability to link multiple emails to a single account will be managed by Supabase Auth's built-in identity management.

1. **Primary Identity**: The first email/provider a user signs up with creates the primary identity in `auth.users`.
2. **Adding a New Email**:
   - The user provides a new email address in the Shaliah UI.
   - The Yesod API will call the Supabase Admin API to link this new email to the existing user `id`.
   - Supabase handles sending a verification (magic) link to the new email.
3. **Login with Secondary Email**: Once verified, the user can log in with any of their linked emails. Supabase Auth will resolve this to the same underlying user `id`, ensuring they access the same `UserProfile`.

This approach leverages Supabase's robust identity management, avoiding the need for a custom `UserEmails` table and simplifying the logic within our application. The `auth.users` table's `identities` field will store this information automatically.
