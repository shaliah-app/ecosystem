/**
 * Example: Using Drizzle's Automatic Type Generation
 * 
 * This file demonstrates the best approach for automatically generating
 * TypeScript types from Drizzle schemas.
 */

// Method 1: Direct type inference from Drizzle schemas
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'

// Import the actual Drizzle schemas from shaliah-next
// Note: This requires the schemas to be accessible from this package
import { authTokens, userProfiles } from '../../apps/shaliah-next/src/db/schema/index.js'

// Automatically generate types from Drizzle schemas
export type AuthToken = InferSelectModel<typeof authTokens>
export type AuthTokenInsert = InferInsertModel<typeof authTokens>
export type UserProfile = InferSelectModel<typeof userProfiles>
export type UserProfileInsert = InferInsertModel<typeof userProfiles>

// Legacy aliases for backward compatibility
export type AuthTokenRow = AuthToken
export type UserProfileRow = UserProfile

/**
 * Method 2: Using Drizzle Kit for type generation
 * 
 * You can also use drizzle-kit to generate types automatically:
 * 
 * 1. Create a drizzle.config.ts in the database-types package
 * 2. Point it to the shaliah-next schemas
 * 3. Use drizzle-kit generate to create types
 * 
 * Example drizzle.config.ts:
 * 
 * ```typescript
 * import { defineConfig } from 'drizzle-kit'
 * 
 * export default defineConfig({
 *   schema: '../apps/shaliah-next/src/db/schema/index.ts',
 *   out: './generated',
 *   dialect: 'postgresql',
 *   introspect: {
 *     casing: 'camel',
 *   },
 * })
 * ```
 * 
 * Then run: `drizzle-kit generate`
 */

/**
 * Method 3: Custom generation script
 * 
 * For more control, you can create a custom script that:
 * 1. Reads the Drizzle schemas
 * 2. Analyzes the table definitions
 * 3. Generates TypeScript interfaces
 * 4. Writes them to files
 * 
 * This is what the generate-types.ts script does.
 */

// Example of how the generated types would look:
const exampleUsage = () => {
  // Using the generated types
  const token: AuthToken = {
    id: 'uuid',
    token: 'abc123',
    user_id: 'user-uuid',
    created_at: '2024-01-01T00:00:00Z',
    expires_at: '2024-01-01T00:15:00Z',
    used_at: null,
    is_active: true
  }

  const tokenInsert: AuthTokenInsert = {
    token: 'abc123',
    user_id: 'user-uuid',
    expires_at: '2024-01-01T00:15:00Z'
    // id, created_at, is_active are optional due to defaults
  }

  const profile: UserProfile = {
    id: 'uuid',
    user_id: 'user-uuid',
    full_name: 'John Doe',
    language: 'en-US',
    telegram_user_id: 123456789,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }

  return { token, tokenInsert, profile }
}

export { exampleUsage }
