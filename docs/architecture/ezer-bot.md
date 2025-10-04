# Telegram Bot Architecture Guide (Ezer Bot)

This guide defines the architectural patterns, conventions, and best practices for the **Ezer Bot** Telegram application, built with the **grammY** framework. Unlike the DDD-heavy approach used in the API and web applications, this bot follows a simpler, feature-based modular architecture optimized for Telegram bot development.

**References:**
- [grammY Structuring Guide](https://grammy.dev/advanced/structuring)
- [grammY Reliability Patterns](https://grammy.dev/advanced/reliability)
- [grammY Scaling Patterns](https://grammy.dev/advanced/scaling)
- [grammY Flood Control](https://grammy.dev/advanced/flood)
- [grammY Deployment Guide](https://grammy.dev/advanced/deployment)
- [grammY i18n Plugin](https://grammy.dev/plugins/i18n)
- [Fluent Syntax Guide](https://projectfluent.org/fluent/guide/)

------------------------------------------------------------------------

# Architectural Philosophy

The Ezer Bot architecture embraces **pragmatism over patterns**. Unlike larger applications that benefit from DDD's layering, Telegram bots are inherently simple: they receive updates, process them, and respond. The architecture reflects this reality:

- **Feature-Focused Modules**: Organize by user features (welcome, search, playlists), not technical layers
- **Composer Pattern**: Each feature is a self-contained grammY Composer
- **Direct Integration**: Bot logic directly uses Supabase and external services—no repository abstraction layers
- **Simple State**: Session data and context extensions handle state needs
- **Minimal Indirection**: Avoid unnecessary abstractions that add complexity without value

This approach keeps the codebase **readable, maintainable, and easy to extend** without sacrificing testability or quality.

------------------------------------------------------------------------

# High-level Architecture Mapping

## Core Concepts

- **Bot Instance (`bot.ts`)**\
  Central bot configuration, middleware registration, and startup logic. This is the composition root where all modules come together.

- **Feature Modules (`modules/`)**\
  Self-contained composers that handle specific user-facing features. Each module exports a `Composer<Context>` that encapsulates all handlers for that feature.

- **Context Types (`types/context.ts`)**\
  Custom context type extending grammY's base context with session data, i18n, menu support, and any custom properties needed across modules.

- **Shared Utilities (`lib/`)**\
  Helper functions, Supabase client configuration, and reusable logic shared across modules. Keep this directory minimal—most logic belongs in feature modules.

- **Localization (`locales/`)**\
  Fluent translation files (`.ftl`) for each supported language. Brazilian Portuguese (`pt-BR.ftl`) and US English (`en.ftl`) are mandatory.

- **Logger (`logger.ts`)**\
  Structured logging with Sentry integration using the shared `@yesod/logger` package. All errors must flow through the global error boundary.

------------------------------------------------------------------------

# Project Structure

```
apps/ezer-bot/
├── src/
│   ├── bot.ts                  # Main entry point: bot instance, middleware, startup
│   ├── logger.ts               # Structured logging and error handling
│   ├── modules/                # Feature modules (composers)
│   │   ├── welcome.ts          # /start command and welcome flow
│   │   ├── search.ts           # Song search functionality
│   │   └── playlists.ts        # Playlist management
│   ├── lib/                    # Shared utilities (minimal)
│   │   └── supabase.ts         # Supabase client configuration
│   ├── types/                  # TypeScript type definitions
│   │   └── context.ts          # Custom Context type
│   └── locales/                # i18n translation files
│       ├── en.ftl              # US English (mandatory)
│       └── pt-BR.ftl           # Brazilian Portuguese (mandatory)
├── __tests__/                  # Vitest tests
│   ├── setup.ts                # Test setup and mocks
│   ├── test-helpers.ts         # Reusable test utilities
│   └── *.test.ts               # Feature tests (mock context pattern)
├── instrument.ts               # Sentry initialization (run before bot.ts)
├── vitest.config.ts            # Vitest configuration
└── package.json                # Dependencies and scripts
```

------------------------------------------------------------------------

# Feature Module Pattern

## Module Structure

Each feature module exports a **single Composer** that encapsulates all handlers for that feature:

```typescript
import { Composer } from 'grammy'
import type { Context } from '../types/context.js'

const composer = new Composer<Context>()

// Commands
composer.command('start', async (ctx) => {
  await ctx.reply(ctx.t('welcome-message'))
})

// Callback queries
composer.callbackQuery('action-name', async (ctx) => {
  await ctx.answerCallbackQuery()
  // Handle action
})

// Text messages (if needed)
composer.on('message:text', async (ctx) => {
  // Handle text input
})

export default composer
```

## Module Responsibilities

- **Single Feature Scope**: Each module handles one user-facing feature (e.g., welcome, search, playlists)
- **Self-Contained Logic**: All handlers for the feature live in the module—no splitting across files unless complexity demands it
- **Direct Dependencies**: Modules can directly import and use Supabase, external APIs, or shared utilities
- **Error Handling**: Module-level errors bubble up to the global error boundary; no per-module error handlers unless absolutely necessary
- **Testing**: Each module should have corresponding tests using the mock context pattern

## Registering Modules

In `bot.ts`, register modules **after session and i18n middleware** but **before the global error handler**:

```typescript
import { Bot, session } from 'grammy'
import { run, sequentialize } from '@grammyjs/runner'
import { I18n } from '@grammyjs/i18n'
import type { Context } from './types/context.js'
import welcomeComposer from './modules/welcome.js'
import searchComposer from './modules/search.js'
import { logger, logBotError } from './logger.js'

const bot = new Bot<Context>(process.env.BOT_TOKEN!)

// 1. Sequentialize updates from the same chat
bot.use(sequentialize((ctx) => ctx.chat?.id.toString()))

// 2. Session middleware
bot.use(session({
  initial: (): SessionData => ({})
}))

// 3. i18n middleware
const i18n = new I18n<Context>({
  defaultLocale: 'en',
  directory: 'src/locales',
})
bot.use(i18n)

// 4. Feature modules
bot.use(welcomeComposer)
bot.use(searchComposer)

// 5. Global error handler
bot.catch(logBotError)

// 6. Start bot with runner
run(bot)
```

------------------------------------------------------------------------

# Middleware Order & Execution

**Middleware order is critical.** grammY executes middleware in a **top-down onion model**:

1. **Before handler**: Middleware runs in registration order
2. **Handler**: The matching handler executes
3. **After handler**: Middleware runs in reverse order (rarely used)

## Standard Order

```typescript
// 1. Sequentialize: Prevent concurrent updates from same chat
bot.use(sequentialize((ctx) => ctx.chat?.id.toString()))

// 2. Session: Load session data from storage
bot.use(session({ /* config */ }))

// 3. i18n: Load translations based on user locale
bot.use(i18n)

// 4. Feature modules: Handle user interactions
bot.use(welcomeComposer)
bot.use(searchComposer)

// 5. Global error handler: Catch all unhandled errors
bot.catch(logBotError)
```

**Why this order?**

- **Sequentialize first**: Prevents race conditions on session data
- **Session before i18n**: Session may store user's preferred language
- **i18n before modules**: Modules need `ctx.t()` available
- **Modules before error handler**: Error handler must be last to catch everything

------------------------------------------------------------------------

# Context & Session Management

## Custom Context Type

Extend grammY's base context with session data, i18n, and any custom properties:

```typescript
import { Context as BaseContext, SessionFlavor } from 'grammy'
import { MenuFlavor } from '@grammyjs/menu'
import { I18nFlavor } from '@grammyjs/i18n'

export interface SessionData {
  // User state for multi-step flows
  searchQuery?: string
  selectedPlaylistId?: string
  // Track conversation context
  lastCommand?: string
  // Feature-specific state
  audioMatchInProgress?: boolean
}

// Combine all flavors
export type Context = BaseContext & 
  SessionFlavor<SessionData> & 
  MenuFlavor & 
  I18nFlavor
```

## Session Best Practices

1. **Keep Session Data Small**: Only store essential state; avoid large objects
2. **Clear Stale Data**: Reset session fields when flows complete
3. **Use Session for Multi-Step Flows**: Track progress in conversations (e.g., search → select → confirm)
4. **Avoid Business Logic in Session**: Sessions store state, not logic
5. **Session Key Strategy**: Default session key (chat + user ID) works for most bots

------------------------------------------------------------------------

# Internationalization (i18n) with Fluent

## Fluent File Structure

Translation files use [Fluent syntax](https://projectfluent.org/fluent/guide/) (`.ftl`):

```fluent
# locales/en.ftl
welcome-message =
    🎵 *Welcome to Ezer Bot!* 🎵

    Hello { $first_name }! I'm your musical companion.

    I can help you with:
    • Song search and discovery
    • Audio matching and identification
    • Playlist management

    Use /help to see all commands.

search-button = 🎵 Search Songs
playlists-button = 📋 My Playlists

search-reply = 
    🔍 *Song Search*

    Send me the name of a song or artist to search.
```

## i18n Configuration

```typescript
import { I18n } from '@grammyjs/i18n'
import type { Context } from './types/context.js'

const i18n = new I18n<Context>({
  defaultLocale: 'en',
  directory: 'src/locales',
  globalTranslationContext(ctx) {
    // Make user data available to all translations
    return {
      first_name: ctx.from?.first_name ?? 'there',
    }
  },
})

bot.use(i18n)
```

## Using Translations

```typescript
composer.command('start', async (ctx) => {
  await ctx.reply(ctx.t('welcome-message'), {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: ctx.t('search-button'), callback_data: 'search' },
          { text: ctx.t('playlists-button'), callback_data: 'playlists' },
        ],
      ],
    },
  })
})
```

## Mandatory Language Support

**Brazilian Portuguese (`pt-BR`) and US English (`en-US`) MUST be updated together.** Never merge a PR with only one language translated.

------------------------------------------------------------------------

# Reliability & Error Handling

## Global Error Boundary

**All errors must flow through `bot.catch()`**:

```typescript
import { GrammyError, HttpError } from 'grammy'
import type { BotError } from 'grammy'
import { logger } from './logger.js'

export function logBotError(err: BotError): void {
  const ctx = err.ctx
  const error = err.error

  logger.error(`Error while handling update ${ctx.update.update_id}`, {
    update: ctx.update,
    chatId: ctx.chat?.id,
    userId: ctx.from?.id,
  })

  if (error instanceof GrammyError) {
    logger.error(`Error in request: ${error.description}`, {
      errorCode: error.error_code,
      ok: error.ok,
    })
  } else if (error instanceof HttpError) {
    logger.error(`Could not contact Telegram: ${error}`, {
      cause: error.cause,
    })
  } else if (error instanceof Error) {
    logger.captureException(error, {
      update: ctx.update,
      chatId: ctx.chat?.id,
      userId: ctx.from?.id,
    })
  }
}

bot.catch(logBotError)
```

## Graceful Shutdown

**Always handle SIGTERM and SIGINT** to stop the bot gracefully:

```typescript
import { run } from '@grammyjs/runner'
import { logger } from './logger.js'

logger.info('🤖 Starting Ezer Bot...')

const runner = run(bot)

const stopRunner = () => runner.isRunning() && runner.stop()
process.once('SIGINT', stopRunner)
process.once('SIGTERM', stopRunner)

logger.info('✅ Ezer Bot is running!')
```

## Callback Query Acknowledgment

**Always answer callback queries** to prevent loading indicators on the client:

```typescript
composer.callbackQuery('search', async (ctx) => {
  await ctx.answerCallbackQuery() // Must be called first
  await ctx.reply(ctx.t('search-reply'))
})
```

------------------------------------------------------------------------

# Scaling & Concurrency

## grammY Runner for Long Polling

**Use `@grammyjs/runner`** for high-performance concurrent update processing:

```typescript
import { run } from '@grammyjs/runner'

// Instead of bot.start()
run(bot)
```

**Benefits:**
- Processes multiple updates concurrently (default limit: 500)
- Fetches new updates while processing current batch
- Automatic load management with backpressure

## Sequentialize to Prevent Race Conditions

**Use `sequentialize()`** to ensure updates from the same chat are processed in order:

```typescript
import { sequentialize } from '@grammyjs/runner'

// Same key as session to prevent race conditions
bot.use(sequentialize((ctx) => ctx.chat?.id.toString()))
```

**Why?** Without sequentialization:
1. User sends message A
2. Bot starts processing A and reads session
3. User sends message B before A finishes
4. Bot starts processing B and reads session
5. Both updates write session data → **last write wins, data loss!**

## Auto-Retry for Flood Control

**Use `@grammyjs/auto-retry`** to handle rate limits automatically:

```typescript
import { autoRetry } from '@grammyjs/auto-retry'

bot.api.config.use(autoRetry())
```

**Do NOT throttle manually.** Telegram's rate limits are dynamic and unknowable. Always:
1. Send requests as fast as possible
2. Let auto-retry handle 429 errors
3. Never add artificial delays

------------------------------------------------------------------------

# Testing Strategy

## Overview

grammY provides two primary approaches for testing bots:

1. **Mock Context Pattern**: Test individual handlers with mock context objects (simple, fast)
2. **Full Bot Testing**: Test complete bot behavior with `bot.handleUpdate()` and API transformers (comprehensive, realistic)

Both approaches have their place. Use mock contexts for unit tests of individual handlers, and full bot testing for integration tests that verify end-to-end behavior.

**References:**
- [grammY Deployment Testing Guide](https://grammy.dev/advanced/deployment#testing)
- [grammY Transformer Functions](https://grammy.dev/advanced/transformers)
- [Telegram Sample Updates](https://core.telegram.org/bots/webhooks#testing-your-bot-with-updates)
- [Example: grammy-with-tests](https://github.com/PavelPolyakov/grammy-with-tests)

------------------------------------------------------------------------

## Full Bot Testing with Transformers (Recommended)

**Use `bot.handleUpdate()` with transformer functions** to test your bot end-to-end without hitting Telegram servers.

### Setup Pattern

```typescript
import { Update } from '@grammyjs/types'
import { ApiCallFn } from 'grammy'
import { beforeAll, beforeEach, expect, test, vi } from 'vitest'
import { bot } from '../src/bot.js'

type ApiFunction = ApiCallFn<typeof bot.api.raw>
type ResultType = Awaited<ReturnType<ApiFunction>>
type Params = Parameters<ApiFunction>
type PayloadType = Params[1]

const isTextPayload = (p: PayloadType): p is { text: string } =>
  'text' in p

// Track outgoing API requests
let outgoingRequests: {
  method: string
  payload: PayloadType
}[] = []

beforeAll(async () => {
  // Install transformer to mock API calls
  bot.api.config.use(async (prev, method, payload) => {
    outgoingRequests.push({ method, payload })
    return { ok: true, result: true as ResultType }
  })

  // Set bot info to avoid getMe call
  bot.botInfo = {
    id: 42,
    first_name: 'Test Bot',
    is_bot: true,
    username: 'test_bot',
    can_join_groups: true,
    can_read_all_group_messages: true,
    supports_inline_queries: false,
  }

  await bot.init()
}, 5000)

beforeEach(() => {
  outgoingRequests = []
})
```

### Helper: Generate Update Objects

```typescript
function generateTextMessage(text: string, chatId = 1111111): Update {
  return {
    update_id: 10000,
    message: {
      date: 1441645532,
      chat: {
        id: chatId,
        type: 'private',
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
      },
      message_id: 1365,
      from: {
        id: chatId,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        is_bot: false,
      },
      text,
    },
  }
}

function generateCallbackQuery(data: string, chatId = 1111111): Update {
  return {
    update_id: 10001,
    callback_query: {
      id: '4382bfdwdsb323b2d9',
      from: {
        id: chatId,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        is_bot: false,
      },
      message: {
        date: 1441645532,
        chat: {
          id: chatId,
          type: 'private',
          first_name: 'Test',
          last_name: 'User',
          username: 'testuser',
        },
        message_id: 1365,
        from: {
          id: 42,
          first_name: 'Test Bot',
          is_bot: true,
          username: 'test_bot',
        },
        text: 'Previous message',
      },
      chat_instance: '-3456789012345678901',
      data,
    },
  }
}
```

### Example Test

```typescript
test('should respond to /start command', async () => {
  await bot.handleUpdate(generateTextMessage('/start'))

  expect(outgoingRequests.length).toBeGreaterThan(0)
  
  const lastRequest = outgoingRequests[outgoingRequests.length - 1]
  expect(lastRequest.method).toBe('sendMessage')
  
  const payload = lastRequest.payload
  expect(isTextPayload(payload)).toBe(true)
  
  if (isTextPayload(payload)) {
    expect(payload.text).toContain('Welcome')
  }
})

test('should handle callback queries', async () => {
  await bot.handleUpdate(generateCallbackQuery('search'))

  expect(outgoingRequests.length).toBeGreaterThan(0)
  
  // Verify answerCallbackQuery was called
  const answerCallback = outgoingRequests.find(
    (req) => req.method === 'answerCallbackQuery'
  )
  expect(answerCallback).toBeDefined()
  
  // Verify reply message
  const reply = outgoingRequests.find(
    (req) => req.method === 'sendMessage'
  )
  expect(reply).toBeDefined()
})
```

------------------------------------------------------------------------

## Mock Context Pattern (Unit Tests)

**Test modules in isolation** using mock contexts for fast unit tests:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import welcomeComposer from '../src/modules/welcome.js'

const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    'welcome-message': 'Welcome to the bot!',
    'search-button': 'Search',
  }
  return translations[key] || key
})

describe('Welcome Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should reply with welcome message and inline keyboard', async () => {
    const mockReply = vi.fn().mockResolvedValue({ message_id: 1 })

    const ctx = {
      reply: mockReply,
      t: mockT,
      message: {
        text: '/start',
        from: { id: 123, first_name: 'Test' },
        chat: { id: 123, type: 'private' },
      },
    } as any

    // Manually trigger handler logic
    await ctx.reply(ctx.t('welcome-message'))

    expect(mockReply).toHaveBeenCalledWith('Welcome to the bot!')
  })
})
```

------------------------------------------------------------------------

## Transformer Functions for Testing

**Transformer functions** allow you to intercept and mock outgoing API calls. This is the recommended approach for integration testing.

### Basic Transformer Setup

```typescript
// Mock all API calls to return success
bot.api.config.use(async (prev, method, payload, signal) => {
  console.log(`Mocked API call: ${method}`, payload)
  return { ok: true, result: true as any }
})
```

### Recording API Calls

```typescript
const apiCalls: Array<{ method: string; payload: any }> = []

bot.api.config.use(async (prev, method, payload, signal) => {
  apiCalls.push({ method, payload })
  // Return appropriate mock response based on method
  if (method === 'sendMessage') {
    return {
      ok: true,
      result: {
        message_id: 123,
        date: Date.now(),
        chat: payload.chat_id,
        text: payload.text,
      },
    }
  }
  return { ok: true, result: true as any }
})
```

### Selective Mocking

```typescript
// Mock only specific methods, pass through others
bot.api.config.use(async (prev, method, payload, signal) => {
  if (method === 'sendMessage') {
    // Mock sendMessage
    return { ok: true, result: { message_id: 123 } as any }
  }
  // Pass through all other methods
  return prev(method, payload, signal)
})
```

------------------------------------------------------------------------

## Telegram Sample Update Objects

Telegram provides [sample update objects](https://core.telegram.org/bots/webhooks#testing-your-bot-with-updates) for testing. Use these as templates:

### Text Message

```typescript
const textMessageUpdate: Update = {
  update_id: 10000,
  message: {
    date: 1441645532,
    chat: {
      last_name: 'Test Lastname',
      id: 1111111,
      type: 'private',
      first_name: 'Test Firstname',
      username: 'Testusername',
    },
    message_id: 1365,
    from: {
      last_name: 'Test Lastname',
      id: 1111111,
      first_name: 'Test Firstname',
      username: 'Testusername',
      is_bot: false,
    },
    text: '/start',
  },
}
```

### Callback Query

```typescript
const callbackQueryUpdate: Update = {
  update_id: 10000,
  callback_query: {
    id: '4382bfdwdsb323b2d9',
    from: {
      last_name: 'Test Lastname',
      id: 1111111,
      first_name: 'Test Firstname',
      username: 'Testusername',
      is_bot: false,
    },
    data: 'Data from button callback',
    inline_message_id: '1234csdbsk4839',
  },
}
```

### Edited Message

```typescript
const editedMessageUpdate: Update = {
  update_id: 10000,
  edited_message: {
    date: 1441645532,
    chat: {
      last_name: 'Test Lastname',
      type: 'private',
      id: 1111111,
      first_name: 'Test Firstname',
      username: 'Testusername',
    },
    message_id: 1365,
    from: {
      last_name: 'Test Lastname',
      id: 1111111,
      first_name: 'Test Firstname',
      username: 'Testusername',
      is_bot: false,
    },
    text: 'Edited text',
    edit_date: 1441646600,
  },
}
```

See [Telegram's full list](https://core.telegram.org/bots/webhooks#testing-your-bot-with-updates) for more examples including audio, documents, photos, and inline queries.

------------------------------------------------------------------------

## Test Structure

- **Unit Tests**: Test individual module handlers with mock contexts (fast, isolated)
- **Integration Tests**: Test complete bot flows with `bot.handleUpdate()` and transformers (realistic, comprehensive)
- **No Real API Calls**: Always mock API calls in tests—never hit Telegram servers

## Test Utilities

Create reusable test helpers in `__tests__/test-helpers.ts`:

```typescript
import { Update } from '@grammyjs/types'
import { vi } from 'vitest'

// Mock context for unit tests
export function createMockContext(overrides = {}): any {
  return {
    reply: vi.fn().mockResolvedValue({ message_id: 1 }),
    answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
    t: vi.fn((key: string) => key),
    session: {},
    chat: { id: 1111111, type: 'private' },
    from: { id: 1111111, first_name: 'Test', is_bot: false },
    ...overrides,
  }
}

// Generate update objects for integration tests
export function generateTextMessage(
  text: string,
  chatId = 1111111
): Update {
  return {
    update_id: Math.floor(Math.random() * 1000000),
    message: {
      date: Math.floor(Date.now() / 1000),
      chat: {
        id: chatId,
        type: 'private',
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
      },
      message_id: Math.floor(Math.random() * 1000000),
      from: {
        id: chatId,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        is_bot: false,
      },
      text,
    },
  }
}

export function generateCallbackQuery(
  data: string,
  chatId = 1111111
): Update {
  return {
    update_id: Math.floor(Math.random() * 1000000),
    callback_query: {
      id: Math.random().toString(36).substring(7),
      from: {
        id: chatId,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        is_bot: false,
      },
      chat_instance: Math.random().toString(),
      data,
    },
  }
}
```

------------------------------------------------------------------------

# Practical Rules & Conventions

## Core Bot Patterns

1. **One Feature, One Module**: Each module handles a single user-facing feature
2. **Composer-Based Architecture**: All modules export `Composer<Context>`
3. **Register Modules in Order**: Sequentialize → Session → i18n → Modules → Error Handler
4. **Direct Dependencies**: Modules can use Supabase, APIs, and utilities directly—no repository abstractions
5. **Minimal `lib/` Directory**: Only put truly shared utilities in `lib/`; most logic belongs in modules
6. **Global Error Boundary**: All errors bubble up to `bot.catch()`; no per-module error handlers
7. **Always Answer Callbacks**: Call `ctx.answerCallbackQuery()` for all callback queries

## grammY-Specific Patterns

8. **Use grammY Runner**: Always use `run(bot)` instead of `bot.start()` for production
9. **Sequentialize Before Session**: Prevent race conditions with `sequentialize((ctx) => ctx.chat?.id.toString())`
10. **Auto-Retry for Flood Control**: Use `@grammyjs/auto-retry` plugin; never throttle manually
11. **Graceful Shutdown**: Handle SIGTERM/SIGINT and stop the runner cleanly
12. **Middleware Order Matters**: Sequentialize → Session → i18n → Modules → Error Handler

## i18n Patterns

13. **Fluent Syntax**: Use `.ftl` files with Fluent syntax for translations
14. **Mandatory Bilingual Support**: Update `pt-BR.ftl` and `en.ftl` together; never merge with only one
15. **Global Translation Context**: Make user data (e.g., first name) available to all translations
16. **Translation Keys in Handlers**: Use `ctx.t('key')` for all user-facing text

## Testing Patterns

17. **Full Bot Testing**: Use `bot.handleUpdate()` with transformer functions for integration tests
18. **Mock Context Testing**: Test modules with mock contexts for fast unit tests
19. **API Mocking with Transformers**: Install transformers to intercept and record outgoing API calls
20. **Sample Update Objects**: Use Telegram's sample updates as templates for test data
21. **Test Utilities**: Create reusable helpers for generating updates and mock contexts
22. **No Real API Calls**: Always mock API calls in tests—never hit Telegram servers
23. **Test Coverage**: Focus on handler logic and end-to-end flows

## Logging & Observability

24. **Structured Logging**: Use `@yesod/logger` for all logging; never use `console.log`
25. **Error Context**: Include `update`, `chatId`, and `userId` in all error logs
26. **Sentry Integration**: Initialize Sentry in `instrument.ts` before importing bot code

------------------------------------------------------------------------

# Supabase Integration

## Client Configuration

Initialize Supabase client in `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!, // Use anon key for bot operations
)
```

## Usage in Modules

Modules can directly import and use the Supabase client:

```typescript
import { supabase } from '../lib/supabase.js'

composer.command('playlists', async (ctx) => {
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('user_id', ctx.from?.id)

  if (error) {
    logger.error('Failed to fetch playlists', { error, userId: ctx.from?.id })
    await ctx.reply(ctx.t('error-fetching-playlists'))
    return
  }

  await ctx.reply(ctx.t('playlists-list', { count: data.length }))
})
```

## Session Storage (Optional)

If using persistent sessions, configure Supabase storage adapter:

```typescript
import { supabaseAdapter } from '@grammyjs/storage-supabase'

bot.use(session({
  initial: (): SessionData => ({}),
  storage: supabaseAdapter({
    supabase,
    table: 'bot_sessions',
  }),
}))
```

------------------------------------------------------------------------

# Deployment Checklist

## Environment Variables

Ensure all required environment variables are set:

- `BOT_TOKEN` (required): Telegram bot token from BotFather
- `SUPABASE_URL` (required): Supabase project URL
- `SUPABASE_ANON_KEY` (required): Supabase anonymous key
- `SENTRY_DSN` (optional): Sentry project DSN for error tracking
- `NODE_ENV` (optional): Set to `production` in production

## Pre-Deployment Checks

1. [ ] Global error handler registered with `bot.catch()`
2. [ ] Graceful shutdown handlers for SIGTERM/SIGINT
3. [ ] `@grammyjs/runner` used instead of `bot.start()`
4. [ ] `sequentialize()` registered before session middleware
5. [ ] All callback queries answered with `ctx.answerCallbackQuery()`
6. [ ] Auto-retry plugin configured for API calls
7. [ ] Sentry initialized in `instrument.ts`
8. [ ] Structured logging used throughout (no `console.log`)
9. [ ] Both `pt-BR.ftl` and `en.ftl` translations complete
10. [ ] Test suite passes with `pnpm test`
11. [ ] Integration tests use `bot.handleUpdate()` with transformer mocks
12. [ ] Unit tests use mock contexts for individual handlers
13. [ ] No real API calls in test suite

## Production Best Practices

- **Process Manager**: Use PM2, systemd, or Docker for process management
- **Log Aggregation**: Send logs to a centralized service (e.g., Sentry, Datadog)
- **Health Checks**: Monitor runner status and Supabase connectivity
- **Deployment Strategy**: Blue-green or rolling deployment to avoid downtime

------------------------------------------------------------------------

# Quick Reference

## File Naming Conventions

- Feature modules: `kebab-case.ts` (e.g., `welcome.ts`, `audio-match.ts`)
- Types: `kebab-case.ts` (e.g., `context.ts`, `session-data.ts`)
- Translation files: `locale-code.ftl` (e.g., `en.ftl`, `pt-BR.ftl`)

## Import Patterns

```typescript
// Core grammY imports
import { Bot, Composer } from 'grammy'
import { run, sequentialize } from '@grammyjs/runner'
import { session } from 'grammy'
import { I18n } from '@grammyjs/i18n'

// Custom types
import type { Context } from './types/context.js'

// Modules
import welcomeComposer from './modules/welcome.js'

// Utilities
import { logger } from './logger.js'
import { supabase } from './lib/supabase.js'
```

## Common Patterns

### Command Handler

```typescript
composer.command('commandname', async (ctx) => {
  await ctx.reply(ctx.t('response-key'))
})
```

### Callback Query Handler

```typescript
composer.callbackQuery('callback-data', async (ctx) => {
  await ctx.answerCallbackQuery()
  await ctx.reply(ctx.t('response-key'))
})
```

### Text Message Handler

```typescript
composer.on('message:text', async (ctx) => {
  const text = ctx.message.text
  // Process text
})
```

### Session Access

```typescript
composer.command('example', async (ctx) => {
  ctx.session.someField = 'value'
  const value = ctx.session.someField
})
```

------------------------------------------------------------------------

# Final Checklist

- [ ] Feature modules organized in `src/modules/`
- [ ] Each module exports a `Composer<Context>`
- [ ] Custom context type defined with session and i18n flavors
- [ ] Middleware registered in correct order
- [ ] Supabase client configured in `lib/supabase.ts`
- [ ] Global error handler with structured logging
- [ ] Graceful shutdown handlers for SIGTERM/SIGINT
- [ ] grammY runner used for concurrent processing
- [ ] Sequentialize middleware prevents race conditions
- [ ] Auto-retry plugin handles flood control
- [ ] Both `pt-BR.ftl` and `en.ftl` translations present
- [ ] Tests use mock context pattern (no full bot instantiation)
- [ ] All callback queries answered
- [ ] Sentry initialized before bot code
- [ ] No `console.log` statements (use `@yesod/logger`)

------------------------------------------------------------------------

**Architecture Version**: 1.0.0  
**Last Updated**: 2025-10-04  
**Framework**: grammY v1.21+  
**Runtime**: Node.js 20+
