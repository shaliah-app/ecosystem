# Frontend Architecture Guide

This guide adapts backend-inspired patterns (DDD, manual DI, factories,
config/constants) into a frontend-friendly structure for **Next.js 15
App Router** applications, using `next-intl`, Zustand, Supabase, and
`shadcn/ui`.

------------------------------------------------------------------------

# High-level mapping: DDD → Frontend

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
    src/
      app/                         # Next.js App Router
        layout.tsx
        page.tsx
        (route segments + layouts)/
         
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

# Supabase practical tips

-   Use `lib/supabase-client.ts` for both browser and server clients,
    but configure them separately (service role vs anon key).\
-   Server actions should always use the server-side client for secure
    mutations.\
-   Realtime subscriptions and file uploads use the browser client.

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
-   [ ] Server-only logic stays in server code\
-   [ ] Zustand stores scoped and minimal\
-   [ ] Presentational UI is pure (shadcn + props)\
-   [ ] i18n handled via `next-intl` with modular JSON files\
-   [ ] Supabase separated into server and browser clients\
-   [ ] Tests cover unit → integration → e2e
