# Full-Stack Application Architecture Guide

This guide adapts backend-inspired patterns (DDD, manual DI, factories,
config/constants) into a full-stack structure for **Next.js 15
App Router** applications, using `next-intl`, Zustand, Supabase, Drizzle ORM, and
`shadcn/ui`. This application serves both UI and API responsibilities.

------------------------------------------------------------------------

# High-level mapping: DDD → Full-Stack Application

-   **Domain (entities, value objects, domain rules)**\
    Keep domain types and pure domain logic inside each module's
    `domain/` folder. These files should be framework-agnostic
    TypeScript with validation, value objects, and factories.

-   **Use Cases / Interactors**\
    Application-specific operations (e.g., `CompleteOnboarding`, `SendMagicLink`)
    live in `use-cases/`. They orchestrate repositories and domain
    logic. They should be pure, depending only on abstractions (ports).

-   **Repositories / Ports**\
    Define repository **interfaces** under `ports/` (when needed). Provide concrete
    implementations in `adapters/`. For simpler cases, use direct Drizzle queries
    in use-cases or dedicated database helper functions in `lib/supabase/database.ts`.

-   **Factories & Validators**\
    Normalize external data into domain entities in
    `domain/*-factory.ts`. Validate with Zod schemas colocated with domain types.

-   **Manual DI**\
    Avoid heavy DI frameworks. Instead, wire repositories into use-cases
    explicitly, usually inside server actions. The composition root
    lives in `lib/di.ts` when needed for complex scenarios.

-   **Database Schema (Drizzle ORM)**\
    All database schema definitions live in `db/schema/` using Drizzle ORM.
    This is the **single source of truth** for the entire ecosystem's database
    structure. Other applications (e.g., poel-worker, ezer-bot) consume generated types
    from this schema. Migrations are managed via Drizzle Kit.

-   **Application State (Zustand)**\
    Zustand is your UI/application state manager. Each module may have
    its own scoped stores (e.g., `songs/stores/`). Global concerns go
    into `src/stores/`. Keep it for ephemeral or cross-component state;
    avoid using it as canonical data storage.

-   **UI / Components**\
    Keep presentational components pure in `src/components/` (shared) or
    `src/modules/*/ui/components/` (feature-scoped). They should rely on
    props and avoid coupling with external state directly. Use shadcn/ui
    components as building blocks.

-   **i18n (next-intl)**\
    Place locale files in `messages/` directory at project root (e.g., `messages/en.json`, `messages/pt-BR.json`).
    Configure `next-intl` in `src/i18n/request.ts` for server-side setup.
    Load translations at the route/layout server component level and pass them down.

-   **Server vs Client Components**

    -   **Server Components**: handle data fetching, auth checks, and
        orchestrating use-cases. Default for pages and layouts.
    -   **Client Components**: handle interactivity and UI state (forms,
        playback, selections). Mark with `'use client'` directive.
    -   **Server Actions**: entrypoints for mutations (calling
        use-cases). Mark with `'use server'` directive.

-   **API Routes (Next.js)**

    -   **Purpose**: Expose REST endpoints for external consumers or complex scenarios
        where server actions are not suitable.
    -   **Location**: `src/app/api/` directory following Next.js App Router conventions.
    -   **Pattern**: Use for HTTP-based integrations, webhooks, or when you need
        full control over request/response handling.

-   **Supabase & Drizzle**

    -   Server-side Supabase client (`lib/supabase/server.ts`) with
        service keys for server actions and server components.
    -   Browser client only for realtime or direct uploads (rarely needed).
    -   **Prefer Drizzle ORM** for type-safe queries in adapters and use-cases.
    -   Supabase client is primarily used for auth; Drizzle handles data queries.

------------------------------------------------------------------------

# Repo layout

    __tests__/                     # Jest + RTL + Vitest tests
      unit/                        # Domain, use-case, factory tests
      integration/                 # Server action, adapter tests
      components/                  # Component tests (RTL)
      contract/                    # API contract tests
    db/
      schema/                      # Drizzle ORM schema (single source of truth)
        index.ts                   # Export all schemas
        users.ts
        user-profiles.ts
        magic-link-attempts.ts
        job-queue.ts               # Background job queue table
      migrations/                  # Drizzle-generated migrations
    drizzle.config.ts              # Drizzle Kit configuration
    messages/                      # i18n translation files (project root)
      en.json
      pt-BR.json
    middleware.ts                  # Next.js middleware (auth, i18n)
    src/
      app/                         # Next.js App Router
        [locale]/                  # Locale-based routing
          layout.tsx
          page.tsx
          auth/                    # Auth routes
            callback/
          onboarding/              # Onboarding routes
          profile/                 # Profile routes
        api/                       # Next.js API routes (REST endpoints)
          user/
            profile/
              route.ts             # PATCH /api/user/profile
         
      modules/                     # Feature modules (bounded contexts)
        onboarding/
          domain/
            onboarding-data.ts     # Domain types & validators
          use-cases/
            complete-onboarding.ts
          ui/
            components/            # Presentational components
              OnboardingForm.tsx
            server/
              actions.ts           # Server actions
          config.ts                # Module constants (TTLs, limits)
        auth/
          domain/
            magic-link-attempt.ts  # Domain entity
            email-address.ts       # Value object
          use-cases/
            send-magic-link.ts
            verify-magic-link.ts
          ui/
            components/
              AuthForm.tsx
              CooldownTimer.tsx
            server/
              actions.ts
          config.ts                # Rate limits, cooldown periods
        # Additional modules follow same pattern

      stores/                      # Global Zustand stores (minimal)
        # Keep global stores minimal - prefer local state

      components/                  # Shared UI components
        ui/                        # shadcn/ui components
          button.tsx
          input.tsx
          card.tsx
          form.tsx
          select.tsx
          # ... other shadcn/ui components
        # Shared presentational components
        Navbar.tsx

      lib/
        env.ts                     # Environment variables (if needed)
        di.ts                      # Composition root (DI wiring, if needed)
        supabase/                  # Supabase clients
          server.ts                # Server-side client (service role)
          client.ts                # Browser client (anon key, if needed)
          database.ts              # Database helper functions
          types.ts                 # Supabase-generated types
        db.ts                      # Drizzle client instance
        utils.ts                   # Utility functions (cn, etc.)
        infer-language.ts          # Language detection

      hooks/                       # Shared React hooks
        useAuth.ts                 # Auth hook

      types/                       # Global TypeScript types
        # Additional shared types if needed

      i18n/                        # next-intl configuration
        request.ts                 # Server-side i18n setup
        routing.ts                 # Routing configuration

------------------------------------------------------------------------

# Wiring / DI approach

-   **Ports & Adapters Pattern** (when beneficial): Modules can define repository interfaces (ports)
    and provide concrete implementations (adapters) for complex data access patterns.
-   **Simplified Pattern** (for most cases): Use direct Drizzle queries in use-cases or
    dedicated database helper functions in `lib/supabase/database.ts`. No need for
    repository abstraction when the implementation is straightforward.
-   **Composition Root**: Use `lib/di.ts` for complex dependency wiring scenarios.
    For simpler cases, import and call directly.
-   **Server Actions**: Inject dependencies (if any) and call use-cases when handling mutations.
    Example:
    ```typescript
    // modules/onboarding/ui/server/actions.ts
    'use server'
    import { completeOnboarding } from '../use-cases/complete-onboarding'
    
    export async function completeOnboardingAction(data: OnboardingData) {
      const user = await getCurrentUser()
      return await completeOnboarding(user.id, data)
    }
    ```
-   **Testing**: Swap real adapters with in-memory fakes or mocks during tests.
-   **No Heavy Frameworks**: Avoid DI frameworks; explicit wiring is preferred.

------------------------------------------------------------------------

# Database Schema Management (Drizzle ORM)

This application is the **single source of truth** for all database schema
definitions in the ecosystem. Other applications (poel-worker, ezer-bot)
consume the generated types from this schema.

## Schema Organization

-   **Location**: `db/schema/` directory at project root
-   **Files**: One file per table or logical grouping (e.g., `users.ts`, `user-profiles.ts`, `job-queue.ts`)
-   **Index**: Export all schemas from `db/schema/index.ts`

## Schema Definition Pattern

```typescript
// db/schema/user-profiles.ts
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'

export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().references(() => users.id),
  fullName: text('full_name'),
  language: text('language').notNull().default('pt-BR'),
  activeSpaceId: uuid('active_space_id'),
  telegramUserId: text('telegram_user_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
```

## Migration Workflow

1.  **Define/modify schema** in `db/schema/*.ts`
2.  **Generate migration**: `pnpm drizzle-kit generate:pg`
3.  **Review migration** in `db/migrations/`
4.  **Apply migration**: `pnpm drizzle-kit push:pg` (dev) or via Supabase migrations (prod)
5.  **Commit schema + migration** together

## Type Sharing with Other Applications

-   **Export types**: `db/schema/index.ts` exports all table schemas
-   **Consumer pattern**: Other apps import via workspace reference:
    ```typescript
    import { jobQueue } from '@yesod/shaliah-next/db/schema'
    import type { InferSelectModel } from 'drizzle-orm'
    
    type Job = InferSelectModel<typeof jobQueue>
    ```
-   **Type inference**: Use Drizzle's `InferSelectModel` and `InferInsertModel`
-   **No duplicate schemas**: Never duplicate schema definitions in consuming apps

## Job Queue Table

The background job queue table is defined in `db/schema/job-queue.ts` and
consumed by poel-worker. This ensures type safety across the producer-consumer
boundary.

## Drizzle Configuration

See `drizzle.config.ts` at project root for connection and migration settings.

------------------------------------------------------------------------

# Testing (TDD) recommendations

-   **Unit tests**: domain entities, validators, factories, and
    use-cases with Vitest.\
-   **Integration tests**: server actions with Supabase test client (Vitest).\
-   **Component tests**: presentational UI with Jest + React Testing Library.\
-   **Store tests**: Zustand store actions and state transitions.\
-   **E2E tests** (optional): full user flows with Playwright or Cypress.

## Test Structure & Patterns

-   **Colocate when possible**: Keep tests close to implementation or in `__tests__/`
-   **Mock Supabase**: Use `createClient` mock in tests
-   **Mock next-intl**: Mock `useTranslations` for component tests
-   **Test isolation**: Each test should clean up after itself
-   **Coverage**: Aim for high coverage of business logic (domain, use-cases)

------------------------------------------------------------------------

# Practical rules / conventions

1.  **Bounded contexts as modules**: Each feature lives under
    `src/modules/<feature>` with domain, use-cases, and ui subdirectories.

2.  **Server-only code**: Adapters, database clients, and secrets stay server-side.
    Never import server code into client components (use `'use server'` directives).

3.  **Immutable domain**: Use factories and validators to enforce domain invariants.
    Validate early (at boundaries), fail fast.

4.  **Minimal global state**: Keep Zustand global stores lean. Prefer local component
    state or server state (via server components/props).

5.  **Repository per aggregate** (when needed): One repository interface per domain aggregate
    for complex data access. For simple CRUD, use direct Drizzle queries or database helpers.

6.  **Server Actions for mutations**: Business logic called via server actions for
    form submissions and client-triggered mutations. For external APIs, use Next.js API routes.

7.  **Schema as source of truth**: All database schema lives in `db/schema/`
    and is shared across the ecosystem via workspace references.

8.  **Ports & Adapters** (when beneficial): Define interfaces (ports) for testability,
    implement (adapters) with Supabase/Drizzle, wire explicitly. Don't over-engineer.

9.  **Type Safety**: Use Drizzle's `InferSelectModel`/`InferInsertModel` for database types,
    Zod for runtime validation at boundaries.

10. **Testing Strategy**: Unit → Integration → Component → E2E. TDD for business logic.

11. **Configuration Management**: Module constants in `config.ts`, environment variables
    validated at startup, never use `process.env` directly in business logic.

12. **Error Handling**: Domain errors propagate up, server actions catch and format,
    UI displays user-friendly messages. Use Sentry for monitoring.

------------------------------------------------------------------------

# i18n specifics (next-intl)

-   **Translation Files**: Located in `messages/` at project root (e.g., `messages/en.json`, `messages/pt-BR.json`).
-   **Supported Locales**: pt-BR (primary) and en-US. Both must be updated together per constitution.
-   **Server Components**: Load translations using `getTranslations()` from `next-intl/server`.
-   **Client Components**: Use `useTranslations()` hook; pass namespace from parent.
-   **Routing**: Locale-based routes via `src/i18n/routing.ts` configuration.
-   **Middleware**: Language detection and cookie management in `middleware.ts`.
-   **Keep Lean**: Small, feature-focused translation files; avoid massive monolithic files.
-   **Nested Keys**: Use dot notation for nested keys (e.g., `auth.magicLink.title`).
-   **Reference**: [next-intl App Router Guide](https://next-intl.dev/docs/getting-started/app-router)

------------------------------------------------------------------------

# Supabase & Drizzle practical tips

-   **Server-side client**: Use `lib/supabase/server.ts` with service role key for
    server actions and server components (secure mutations and queries).

-   **Browser client**: Use `lib/supabase/client.ts` with anon key only when needed
    for realtime subscriptions or direct file uploads (rare).

-   **Auth**: Use Supabase Auth for authentication. Check auth in middleware,
    server actions, and API routes. Never trust client-side auth state.

-   **Queries**: Prefer Drizzle ORM (`lib/db.ts`) for type-safe queries in adapters
    and use-cases. Supabase client is primarily for auth operations.

-   **Row-Level Security (RLS)**: Enable RLS on all tables in Supabase. Define
    policies that enforce access control at the database level.

-   **Transactions**: Use Drizzle's transaction support for multi-step operations
    that need atomicity.

-   **Connection Pooling**: Drizzle handles connection pooling automatically via
    postgres.js or pg driver.

------------------------------------------------------------------------

# State sharing considerations

-   Do **not** use Zustand to share server-rendered state across server
    and client boundaries.\
-   Server state should come from server components (via async data fetching)
    or serialized props.\
-   Zustand stores are only for client-side ephemeral or interactive
    state (UI toggles, form state, playback state).\
-   For data synchronization between server and client, use server actions
    with revalidation or Supabase realtime subscriptions.

------------------------------------------------------------------------

# Example feature workflow

## Scenario: Adding User Profile Language Update

1.  **Domain**: Define domain types and validators in `modules/profile/domain/`.
    ```typescript
    // modules/profile/domain/user-profile.ts
    import { z } from 'zod'
    
    export const languageSchema = z.enum(['en-US', 'pt-BR'])
    
    export type Language = z.infer<typeof languageSchema>
    
    export type UserProfile = {
      id: string
      fullName: string | null
      language: Language
      avatarUrl: string | null
    }
    ```

2.  **Database Schema**: Define table in `db/schema/user-profiles.ts` using Drizzle.
    ```typescript
    export const userProfiles = pgTable('user_profiles', {
      id: uuid('id').primaryKey(),
      fullName: text('full_name'),
      language: text('language').notNull().default('pt-BR'),
      avatarUrl: text('avatar_url'),
      // ... other fields
    })
    ```

3.  **Database Helper**: Add function in `lib/supabase/database.ts` (or create adapter if complex).
    ```typescript
    import { db } from '@/lib/db'
    import { userProfiles } from '@/db/schema'
    import { eq } from 'drizzle-orm'
    
    export async function updateUserProfile(
      userId: string,
      updates: Partial<UserProfile>
    ) {
      const [updated] = await db
        .update(userProfiles)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(userProfiles.id, userId))
        .returning()
      return updated
    }
    ```

4.  **Use Case**: Create `modules/profile/use-cases/update-language.ts`.
    ```typescript
    import { languageSchema } from '../domain/user-profile'
    import { updateUserProfile } from '@/lib/supabase/database'
    
    export async function updateProfileLanguage(
      userId: string,
      language: unknown
    ) {
      // Domain validation
      const validated = languageSchema.parse(language)
      // Update in database
      return await updateUserProfile(userId, { language: validated })
    }
    ```

5.  **Server Action**: Wire use-case in `modules/profile/ui/server/actions.ts`.
    ```typescript
    'use server'
    import { updateProfileLanguage } from '../use-cases/update-language'
    import { createClient } from '@/lib/supabase/server'
    import { revalidatePath } from 'next/cache'
    
    export async function updateLanguageAction(language: string) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Unauthorized')
      }
      
      const updated = await updateProfileLanguage(user.id, language)
      revalidatePath('/profile')
      return updated
    }
    ```

6.  **API Route** (alternative for external consumers): Create `app/api/user/profile/route.ts`.
    ```typescript
    import { NextRequest, NextResponse } from 'next/server'
    import { updateProfileLanguage } from '@/modules/profile/use-cases/update-language'
    import { createClient } from '@/lib/supabase/server'
    
    export async function PATCH(request: NextRequest) {
      const { language } = await request.json()
      const supabase = await createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      const updated = await updateProfileLanguage(user.id, language)
      return NextResponse.json(updated)
    }
    ```

7.  **UI Component**: Build `ProfileLanguageSelector.tsx` as client component.
    ```typescript
    'use client'
    import { useForm } from 'react-hook-form'
    import { updateLanguageAction } from '../server/actions'
    
    export function ProfileLanguageSelector({ currentLanguage }) {
      const form = useForm({ defaultValues: { language: currentLanguage } })
      
      const onSubmit = async (data) => {
        await updateLanguageAction(data.language)
        // Optionally show toast notification
      }
      
      return (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Select {...form.register('language')}>
              <option value="en-US">English</option>
              <option value="pt-BR">Português</option>
            </Select>
            <Button type="submit">Save</Button>
          </form>
        </Form>
      )
    }
    ```

8.  **Tests**:
    - Unit test: `updateProfileLanguage` use-case with validation scenarios
    - Integration test: `updateLanguageAction` with test database
    - Component test: `ProfileLanguageSelector` with RTL and mocked action

9.  **i18n**: Update `messages/en.json` and `messages/pt-BR.json` with new keys.
    ```json
    {
      "profile": {
        "changeLanguage": "Change Language",
        "languageSaved": "Language preference saved"
      }
    }
    ```

------------------------------------------------------------------------

# Final quick checklist

-   [ ] Domain types and validators defined per module
-   [ ] Use-cases orchestrate business logic (pure, testable)
-   [ ] Ports & adapters for complex scenarios, direct queries for simple ones
-   [ ] DI wiring in `lib/di.ts` (when needed)
-   [ ] Database schema defined in `db/schema/` with Drizzle ORM
-   [ ] Drizzle migrations generated and committed
-   [ ] Schema types exported for ecosystem consumption
-   [ ] Server-only code protected (never imported in client components)
-   [ ] Zustand stores scoped and minimal (ephemeral state only)
-   [ ] Presentational UI is pure (shadcn/ui + props)
-   [ ] i18n handled via `next-intl` with messages/ files (pt-BR and en-US)
-   [ ] Supabase separated into server and browser clients
-   [ ] Drizzle ORM used for type-safe database queries
-   [ ] Server actions for mutations, API routes for external consumers
-   [ ] Tests cover unit → integration → component → E2E
-   [ ] Configuration in module `config.ts` files
-   [ ] Error handling with Sentry monitoring
-   [ ] Middleware handles auth and i18n routing
