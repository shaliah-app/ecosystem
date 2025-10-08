# @yesod/database-types

Shared database types for the Yesod ecosystem, generated from Drizzle schemas.

## Installation

```bash
pnpm add @yesod/database-types
```

## Usage

```ts
import { AuthToken, UserProfile, AuthTokenRow, UserProfileRow } from '@yesod/database-types'

// Use the generated types
const token: AuthToken = {
  id: 'uuid',
  token: 'abc123',
  user_id: 'user-uuid',
  created_at: '2024-01-01T00:00:00Z',
  expires_at: '2024-01-01T00:15:00Z',
  used_at: null,
  is_active: true
}

// Legacy aliases for backward compatibility
const legacyToken: AuthTokenRow = token
```

## Available Types

- `AuthToken` / `AuthTokenRow` - Auth tokens table
- `UserProfile` / `UserProfileRow` - User profiles table
- `AuthTokenInsert` - For inserting new auth tokens
- `UserProfileInsert` - For inserting new user profiles

## Schema Sources

Types are generated from Drizzle schemas defined in the shaliah-next application to ensure consistency across the monorepo.

---

## Adding New Types

This guide explains how to add new database table types to the shared package using **automatic generation from Drizzle schemas**.

### 🚀 **Automatic Type Generation (RECOMMENDED)**

The best approach is to use Drizzle's built-in type generation capabilities:

#### **Option 1: Direct Drizzle Type Inference**

```typescript
// packages/database-types/src/notifications.ts
// Auto-generated from Drizzle schema
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import { notifications } from '../../apps/shaliah-next/src/db/schema/notifications.js'

// Generated TypeScript types from Drizzle schema
export type Notification = InferSelectModel<typeof notifications>
export type NotificationInsert = InferInsertModel<typeof notifications>

// Legacy type aliases for backward compatibility with existing code
export type NotificationRow = Notification
```

#### **Option 2: Use the Generation Script**

Run the automatic type generation script:

```bash
cd packages/database-types
pnpm generate-types
```

This will automatically generate types from your Drizzle schemas.

### 📝 **Manual Type Creation (Alternative)**

If you prefer manual control, follow these steps:

#### **Step 1: Identify the Source Schema**

First, find the Drizzle schema definition in `apps/shaliah-next/src/db/schema/`. For example, if you want to add types for a new `notifications` table:

```typescript
// apps/shaliah-next/src/db/schema/notifications.ts
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid('user_id').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  read: boolean('read').notNull().default(false),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
```

#### **Step 2: Create the Type File**

Create a new file in `packages/database-types/src/` following the naming convention:

```typescript
// packages/database-types/src/notifications.ts
// Notifications table types - generated from database schema
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface NotificationInsert {
  id?: string;
  user_id: string;
  title: string;
  message: string;
  read?: boolean;
  created_at?: string;
}

// Legacy type aliases for backward compatibility with existing code
export type NotificationRow = Notification
```

#### **Step 3: Update the Index File**

Add the new types to the main export file:

```typescript
// packages/database-types/src/index.ts
// Database schema exports
export * from './auth-tokens'
export * from './user-profiles'
export * from './notifications'  // Add this line
```

#### **Step 4: Build and Test**

Build the package and run tests to ensure everything works:

```bash
cd packages/database-types
pnpm build
pnpm test
```

#### **Step 5: Update Applications**

Add the dependency to any application that needs the new types:

```json
// apps/your-app/package.json
{
  "dependencies": {
    "@yesod/database-types": "workspace:*"
  }
}
```

Then use the types in your application:

```typescript
import { Notification, NotificationInsert } from '@yesod/database-types'

// Use the new types
const notification: Notification = {
  id: 'uuid',
  user_id: 'user-uuid',
  title: 'New Message',
  message: 'You have a new message',
  read: false,
  created_at: '2024-01-01T00:00:00Z'
}
```

## Type Naming Conventions

### Interface Names
- **Select types**: Use singular PascalCase (e.g., `Notification`, `UserProfile`)
- **Insert types**: Add `Insert` suffix (e.g., `NotificationInsert`, `UserProfileInsert`)

### Legacy Aliases
- **Row types**: Add `Row` suffix for backward compatibility (e.g., `NotificationRow`)

### File Names
- Use kebab-case for file names (e.g., `user-profiles.ts`, `auth-tokens.ts`)
- Match the table name from the database schema

## Type Structure Guidelines

### Required Fields
- All fields that are `NOT NULL` in the database should be required in the interface
- Use `string` for UUIDs, timestamps, and text fields
- Use `number` for numeric fields
- Use `boolean` for boolean fields

### Optional Fields
- Fields that can be `NULL` in the database should be optional (`field?: type`)
- Fields with default values should be optional in `Insert` types

### Insert Types
- Include all fields from the select type
- Make auto-generated fields optional (id, created_at, etc.)
- Make fields with default values optional

## Examples

### Simple Table
```typescript
// For a table with minimal fields
export interface SimpleRecord {
  id: string;
  name: string;
  created_at: string;
}

export interface SimpleRecordInsert {
  id?: string;
  name: string;
  created_at?: string;
}
```

### Complex Table with Relationships
```typescript
// For a table with foreign keys and complex fields
export interface Order {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  total_price: number;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderInsert {
  id?: string;
  user_id: string;
  product_id: string;
  quantity: number;
  total_price: number;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}
```

## Maintenance

### When to Update Types
- When database schema changes in `apps/shaliah-next`
- When new tables are added
- When column types change
- When new constraints are added

### Testing New Types
Always add tests for new types:

```typescript
// packages/database-types/__tests__/notifications.test.ts
import { describe, it, expect } from 'vitest'
import { Notification, NotificationInsert } from '../src/notifications'

describe('Notification Types', () => {
  it('should create valid Notification object', () => {
    const notification: Notification = {
      id: 'test-id',
      user_id: 'user-id',
      title: 'Test Title',
      message: 'Test Message',
      read: false,
      created_at: '2024-01-01T00:00:00Z'
    }
    
    expect(notification.id).toBe('test-id')
    expect(notification.read).toBe(false)
  })

  it('should create valid NotificationInsert object', () => {
    const insert: NotificationInsert = {
      user_id: 'user-id',
      title: 'Test Title',
      message: 'Test Message'
    }
    
    expect(insert.user_id).toBe('user-id')
    expect(insert.read).toBeUndefined() // Optional field
  })
})
```

## Troubleshooting

### Common Issues

1. **Type not found**: Make sure you've added the export to `src/index.ts`
2. **Build errors**: Check that all required fields are included
3. **Import errors**: Ensure the package is properly linked in your workspace

### Verification Steps

1. Build the package: `pnpm build`
2. Run tests: `pnpm test`
3. Check that types are exported: `pnpm run build && node -e "console.log(Object.keys(require('./dist/index.js')))"`
4. Test in consuming application: Import and use the types

## Advanced: Full Drizzle Integration

For the most advanced setup, you can use Drizzle's full introspection capabilities:

### Option 3: Drizzle Kit Type Generation

Create a `drizzle.config.ts` in the database-types package:

```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: '../apps/shaliah-next/src/db/schema/index.ts',
  out: './generated',
  dialect: 'postgresql',
  introspect: {
    casing: 'camel',
  },
})
```

Then run:
```bash
drizzle-kit generate
```

This will automatically generate types from your database schema.

### Option 4: Custom Generation Script

Use the provided generation scripts:

```bash
# Basic generation
pnpm generate-types

# Advanced generation with introspection
tsx scripts/generate-from-drizzle.ts
```

## Contributing

When adding new types:

1. **Prefer automatic generation** over manual creation
2. Follow the naming conventions
3. Include both select and insert types
4. Add legacy aliases for backward compatibility
5. Write tests for the new types
6. Update this README if needed
7. Build and test before committing

## Examples

See `examples/drizzle-auto-generation.ts` for complete examples of how to use Drizzle's automatic type generation.
