# Full-Stack Application Architecture Guide

This guide adapts backend-inspired patterns (DDD, manual DI, factories,
config/constants) into a full-stack structure f1.  **Bounded contexts as modules**: Each feature lives under
    `src/modules/<feature>`.\
2.  **Server-only code**: Adapters with secrets stay server-side and are
    never imported into client components.\
3.  **Immutable domain**: Use factories to enforce consistency.\
4.  **Minimal global state**: Keep zustand global stores lean. Prefer
    local state for most cases.\
5.  **Repo per external system**: One interface per integration
    (e.g. `SongRepository`, `AuthRepository`).\
6.  **Server Actions for mutations**: Keep business logic close to the
    UI entrypoint. For more complex API needs, use Next.js API routes.\
7.  **Schema as source of truth**: All database schema lives in `db/schema/`
    and is shared across the ecosystem via workspace references.s 15
App Router** applications, using `next-intl`, Zustand, Supabase, Drizzle ORM, and
`shadcn/ui`. This application serves both UI and API responsibilities.

------------------------------------------------------------------------

# High-level mapping: DDD → Full-Stack Application

-   **Domain (entities, value objects, domain rules)**\
    Keep domain types and pure domain logic inside each module's
    `domain/` folder. These files should be framework-agnostic
    TypeScript with validation, value objects, and factories.

-   **Use Cases / Interactors**\
    Application-specific operations (e.g., `CreateSong`, `GetSongs`)
    live in `use-cases/`. They orchestrate repositories and domain
    logic. They should be pure, depending only on abstractions (ports).

-   **Repositories / Ports**\
    Define repository **interfaces** under `ports/`. Provide concrete
    implementations in `adapters/`. Example: `SongRepository`
    (interface) and `supabase-song-repo.ts` (Supabase implementation).

-   **Factories**\
    Normalize external data into domain entities in
    `domain/*-factory.ts`. Example: `SongFactory.fromSupabase(row)`.

-   **Manual DI**\
    Avoid heavy DI frameworks. Instead, wire repositories into use-cases
    explicitly, usually inside server actions. The composition root
    lives in `lib/di.ts`.

-   **Database Schema (Drizzle ORM)**\
    All database schema definitions live in `db/schema/` using Drizzle ORM.
    This is the **single source of truth** for the entire ecosystem's database
    structure. Other applications (e.g., poel-worker) consume generated types
    from this schema. Migrations are managed via Drizzle Kit.

-   **Application State (Zustand)**\
    Zustand is your UI/application state manager. Each module may have
    its own scoped stores (e.g., `songs/stores/`). Global concerns go
    into `src/stores/`. Keep it for ephemeral or cross-component state;
    avoid using it as canonical data storage.

-   **UI / Components**\
    Keep dumb presentational components in `components/` (global) or
    `modules/*/ui/components/` (feature-scoped). They should rely on
    props and avoid coupling with external state directly.

-   **i18n (next-intl)**\
    Place locale files under `i18n/` and configure `next-intl` in
    `i18n/index.ts`. Load translations at the route/layout server
    component level and pass them down.

-   **Server vs Client Components**

    -   **Server Components**: handle data fetching, auth checks, and
        orchestrating use-cases.\
    -   **Client Components**: handle interactivity and UI state (forms,
        playback, selections).\
    -   **Server Actions**: entrypoints for mutations (calling
        use-cases).

-   **Supabase**

    -   Server-side Supabase client (`lib/supabase-client.ts`) with
        service keys for server actions and server components.\
    -   Browser client only for realtime or direct uploads.

------------------------------------------------------------------------

# Repo layout

    __tests__/                     # Jest + RTL tests
      unit/
      integration/
      e2e/
    db/
      schema/                      # Drizzle ORM schema (single source of truth)
        index.ts
        users.ts
        songs.ts
        job-queue.ts               # Background job queue table
      migrations/                  # Drizzle-generated migrations
    drizzle.config.ts              # Drizzle Kit configuration
    src/
      app/                         # Next.js App Router
        layout.tsx
        page.tsx
        (route segments + layouts)/
        api/                       # Next.js API routes (REST endpoints)
          user/
            profile/
              route.ts
         
      modules/                     # Bounded contexts
        songs/
          domain/
            song.ts                # Domain types & value objects
            song-validators.ts
            song-factory.ts
          ports/
            song-repository.ts     # Interface (contract)
          adapters/
            supabase-song-repo.ts  # Concrete repo impl
          use-cases/
            create-song.ts
            get-songs.ts
          ui/
            components/            # Presentational + client comps
              song-form.tsx
              song-list.tsx
            server/
              actions.ts           # Server actions for this module
            hooks/
              use-song-search.ts
          stores/                  # Zustand stores (scoped to songs)
            player-store.ts
            queue-store.ts
          config.ts                # Module-specific constants

      stores/                      # Cross-cutting Zustand stores
        auth-store.ts
        ui-store.ts                # e.g. theme, modals, global toasts

      components/                  # Shared UI components
        ui/                        # shadcn/ui wrappers
          button.tsx
          input.tsx
        layout/
          header.tsx
          sidebar.tsx

      lib/
        env.ts                     # env variables, constants
        di.ts                      # composition root (wire adapters)
        supabase-client.ts         # base Supabase client
        db.ts                      # Drizzle client instance

      hooks/                       # Shared UI or form helpers
        use-server-action.ts

      i18n/
        en.json
        pt.json
        index.ts                   # next-intl setup

------------------------------------------------------------------------

# Wiring / DI approach

-   Each module defines its ports and adapters.\
-   Use `lib/di.ts` as a composition root to map adapters to ports.\
-   In **server actions**, inject the concrete repo into use-cases and
    run the business logic.\
-   For testing, swap real adapters with in-memory fakes or mocks.

------------------------------------------------------------------------

# Database Schema Management (Drizzle ORM)

This application is the **single source of truth** for all database schema
definitions in the ecosystem. Other applications (poel-worker, ezer-bot)
consume the generated types from this schema.

## Schema Organization

-   **Location**: `db/schema/` directory at project root
-   **Files**: One file per table or logical grouping (e.g., `users.ts`, `songs.ts`, `job-queue.ts`)
-   **Index**: Export all schemas from `db/schema/index.ts`

## Schema Definition Pattern

```typescript
// db/schema/songs.ts
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'

export const songs = pgTable('songs', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  artist: text('artist').notNull(),
  userId: uuid('user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
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
    import { songs, jobQueue } from '@yesod/shaliah-next/db/schema'
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
    use-cases.\
-   **Integration tests**: server actions with Supabase test client.\
-   **Component tests**: presentational UI with Jest + RTL.\
-   **Store tests**: Zustand store actions and state transitions.\
-   **e2e tests**: full user flows with something like Playwright or
    Cypress.

------------------------------------------------------------------------

# Practical rules / conventions

1.  **Bounded contexts as modules**: Each feature lives under
    `src/modules/<feature>`.\
2.  **Server-only code**: Adapters with secrets stay server-side and are
    never imported into client components.\
3.  **Immutable domain**: Use factories to enforce consistency.\
4.  **Minimal global state**: Keep zustand global stores lean. Prefer
    local state for most cases.\
5.  **Repo per external system**: One interface per integration
    (e.g. `SongRepository`, `AuthRepository`).\
6.  **Server Actions for mutations**: Keep business logic close to the
    UI entrypoint.

------------------------------------------------------------------------

# i18n specifics

-   Load translations at route/layout server components. For more understanding, [fetch and read](https://next-intl.dev/docs/getting-started/app-router).see\
-   Pass translation functions to client components.\
-   Keep `i18n/*.json` files small and feature-focused.

------------------------------------------------------------------------

# Supabase & Drizzle practical tips

-   Use `lib/supabase-client.ts` for both browser and server clients,
    but configure them separately (service role vs anon key).\
-   Server actions should always use the server-side client for secure
    mutations.\
-   Realtime subscriptions and file uploads use the browser client.\
-   **Prefer Drizzle ORM** for type-safe queries in adapters (use `lib/db.ts`).\
-   Supabase client is still used for auth and realtime; Drizzle handles data queries.

------------------------------------------------------------------------

# State sharing considerations

-   Do **not** use Zustand to share server-rendered state across server
    and client boundaries.\
-   Server state should come from server components or serialized
    props.\
-   Zustand stores are only for client-side ephemeral or interactive
    state.

------------------------------------------------------------------------

# Example feature workflow

1.  **Domain**: Define `Song` type and validation in `domain/`.\
2.  **Use-case**: Add `create-song.ts` in `use-cases/`.\
3.  **Adapter**: Implement `supabase-song-repo.ts`.\
4.  **Server Action**: Wire use-case and adapter in
    `ui/server/actions.ts`.\
5.  **UI**: Build `song-form.tsx` as a client component using the server
    action.\
6.  **State**: Manage playback/queue with `songs/stores/*`.\
7.  **Tests**: Unit-test domain and use-case, RTL-test the form,
    integration-test the action.

------------------------------------------------------------------------

# Final quick checklist

-   [ ] Domain/use-cases/ports/adapters split per module\
-   [ ] DI wiring in `lib/di.ts`\
-   [ ] Database schema defined in `db/schema/` with Drizzle ORM\
-   [ ] Drizzle migrations generated and committed\
-   [ ] Schema types exported for ecosystem consumption\
-   [ ] Server-only logic stays in server code\
-   [ ] Zustand stores scoped and minimal\
-   [ ] Presentational UI is pure (shadcn + props)\
-   [ ] i18n handled via `next-intl` with modular JSON files\
-   [ ] Supabase separated into server and browser clients\
-   [ ] Drizzle ORM used for type-safe database queries\
-   [ ] Tests cover unit → integration → e2e
