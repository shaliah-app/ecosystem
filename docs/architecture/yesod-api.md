# Backend API Architecture Guide

This guide adapts Domain-Driven Design (DDD) patterns into a backend-friendly structure for **Hono.js APIs** on Node.js, using Drizzle ORM, Supabase, and Vitest testing. It follows the constitutional principles of domain-centric architecture with clear separation of concerns.

**References:**
- [Hono Best Practices](https://hono.dev/docs/guides/best-practices)
- [Hono Testing Guide](https://hono.dev/docs/guides/testing)
- [Hono Helpers](https://hono.dev/docs/guides/helpers)
- [Hono Middleware](https://hono.dev/docs/guides/middleware)

------------------------------------------------------------------------

# High-level mapping: DDD → Backend API

-   **Domain (entities, value objects, domain services)**\
    Keep domain types, validation logic, and business rules inside each context's `domain/` folder. These files should be framework-agnostic TypeScript with entities, value objects, and domain services.

-   **Application (use cases / interactors)**\
    Application-specific operations live in `application/use-cases/`. They orchestrate domain logic and repositories. They should be pure, depending only on abstractions (repository interfaces).

-   **Infrastructure (repositories, external services)**\
    Concrete implementations of repositories and external service integrations live in `infra/`. This layer adapts external systems (database, Supabase, external APIs) to domain interfaces.

-   **API (routes, handlers, middleware)**\
    HTTP-specific concerns live in `api/`. This includes route definitions, request/response handling, and Hono middleware. Handlers wire use cases with dependencies and handle HTTP concerns.

-   **Manual DI (Dependency Injection)**\
    Avoid heavy DI frameworks. Instead, wire repository implementations into use-cases explicitly in API handlers. The composition root lives in the handler files.

-   **Configuration & Constants**\
    Context-specific constants and configuration live in `constants.ts`. Global configuration uses `config/env.ts` with Zod validation.

-   **Database Schema**\
    Database schemas defined in TypeScript using Drizzle ORM live in `db/schema/`. Migrations are generated and applied using Drizzle Kit.

------------------------------------------------------------------------

# Suggested repo layout

    __tests__/                     # Vitest tests
      unit/                        # Domain and use-case tests
        contexts/
          auth/
          users/
      integration/                 # API handler and repository tests
        contexts/
          auth/
          users/
      contract/                    # Contract tests for external integrations

    src/
      config/                      # Global configuration
        env.ts                     # Environment variables with Zod validation

      db/                          # Database layer
        index.ts                   # Drizzle connection and client
        schema/                    # Drizzle schema definitions
          index.ts
          magic-link-attempts.ts

      contexts/                    # Bounded contexts (DDD)
        auth/
          constants.ts             # Context-specific constants
          domain/
            entities/              # Domain entities and value objects
              magic-link-attempt.ts
            services/              # Domain services (business rules)
              rate-limit-policy.ts
          application/
            use-cases/             # Application use cases
              send-magic-link.use-case.ts
          infra/
            repositories/          # Repository implementations
              magic-link-attempt.repository.ts
            services/              # External service adapters
              supabase-auth.service.ts
          api/
            handlers/              # HTTP handlers
              magic-link-request.handler.ts
            routes.ts              # Hono route definitions

        users/
          constants.ts
          domain/
            entities/
            services/
          application/
            use-cases/
          infra/
            repositories/
            services/
          api/
            handlers/
            routes.ts

      middleware/                  # Global middleware
        auth.ts                    # Authentication middleware

      routes/                      # Legacy routes (being migrated)
        auth.ts
        profile.ts

      types.ts                     # Global type definitions

      index.ts                     # Main Hono app composition
      server.ts                    # Server startup

------------------------------------------------------------------------

# Wiring / DI approach

-   Repositories are concrete classes (no separate interface definitions) for simplicity.\
-   Use-cases depend directly on concrete repository classes.\
-   In **API handlers**, instantiate repository and service dependencies, then inject them into use-cases.\
-   For testing, swap real implementations with in-memory fakes or mocks.\
-   **Use `createFactory()` for complex DI**: When multiple handlers share similar dependencies, use `hono/factory` to create factories that encapsulate dependency wiring.\
-   **Avoid RoR-like controllers**: Don't extract handlers into separate controller functions unless using `createHandlers()` from `hono/factory` for proper type inference.

**Reference**: [Hono Best Practices](https://hono.dev/docs/guides/best-practices)

------------------------------------------------------------------------

# Testing (TDD) recommendations

## Test Structure & Organization

-   **Unit tests**: domain entities, domain services, and use-cases with mocked dependencies.\
-   **Integration tests**: API handlers with real database connections and external services.\
-   **Contract tests**: External service integrations (Supabase, external APIs).\
-   **Test structure**: Mirror source structure in `__tests__/unit/contexts/` and `__tests__/integration/contexts/`.

## Hono Testing Patterns

-   **Use `app.request()` for end-to-end testing**: Pass URL or Request object to test complete request/response cycle.\
-   **Test request methods**: Use `app.request(path, { method: 'POST', body, headers })` for different HTTP methods.\
-   **Verify responses**: Check `res.status`, `res.headers`, `await res.json()`, `await res.text()` in assertions.\
-   **Mock environment variables**: Pass third parameter to `app.request(path, options, mockEnv)` for Bindings.\
-   **Type-safe testing with `testClient()`**: Use `testClient` from `hono/testing` for RPC-style testing with full type inference.

## Vitest Configuration

-   **Test runner**: Use Vitest exclusively for all backend/API tests (unit, integration, contract).\
-   **Async tests**: All tests should be async when testing handlers that return promises.\
-   **Test isolation**: Each test should create fresh instances and clean up after itself.\
-   **Coverage**: Aim for high coverage of domain logic, use-cases, and critical API paths.\
-   **Configuration**: Define `vitest.config.ts` in the project root with appropriate test patterns.

**Reference**: [Hono Testing Guide](https://hono.dev/docs/guides/testing)

------------------------------------------------------------------------

# Practical rules / conventions

## Core DDD Patterns

1.  **Bounded contexts as top-level organization**: Each business capability lives under `src/contexts/<context>`.\
2.  **Strict layering**: Domain depends on nothing, application depends on domain, infra depends on domain, API depends on all layers.\
3.  **Entities and value objects**: Use classes with private constructors and factory methods for validation.\
4.  **Domain services**: Pure functions for complex business rules that don't fit in entities.\
5.  **Use cases**: Single responsibility, orchestrate domain logic and repositories.\
6.  **Repositories**: One per aggregate root, implement CRUD operations with domain object mapping.\
7.  **Constants**: Context-specific values in `constants.ts`, validated environment variables in `config/env.ts`.\
8.  **Error handling**: Domain throws business errors (custom error classes), use-cases propagate them, API handlers catch and convert to `HTTPException` with appropriate status codes.\
9.  **Logging**: Use structured logging from `@yesod/logger` package throughout all layers.

## Hono-Specific Patterns

### Routing & Handlers

10. **Avoid "Controllers"**: Write handlers inline with route definitions for proper type inference. Use `createHandlers()` from `hono/factory` only when separation is necessary.\
11. **Route chaining for type inference**: Chain route methods directly on Hono instances for RPC support: `const route = app.get(...).post(...)`.\
12. **Handler placement**: Define handlers inline after path definitions to maintain type safety and path parameter inference.\
13. **Use `app.route()` for modularity**: Mount bounded context sub-apps with `app.route('/context', contextApp)` instead of creating controllers.

### Middleware & Request Handling

14. **Middleware execution order**: Middleware executes in registration order before handlers (top-down), then in reverse order after handlers (bottom-up, onion model).\
15. **Use `createMiddleware()` for custom middleware**: Import from `hono/factory` to preserve type safety for context and variables.\
16. **Register middleware before routes**: Global middleware (logger, CORS, auth) must be registered before route definitions to execute properly.\
17. **Context extension**: Use `c.set()` in middleware to pass data to handlers; define `Variables` type for type safety.\
18. **Never block request/response cycle**: Long operations (>1s) must use background jobs via `pg-boss`.

### Error Handling & Validation

19. **Use `HTTPException` for errors**: Import from `hono/http-exception` for consistent error responses with status codes.\
20. **Global error handler**: Define `app.onError()` to catch uncaught exceptions and format error responses.\
21. **Validation at API boundary**: Use Zod with `zValidator` middleware to validate inputs before reaching use cases.\
22. **Type-safe validation**: Extract validated data with `c.req.valid()` in handlers after validator middleware.

### Testing Patterns

23. **Use `app.request()` for testing**: Test handlers end-to-end by passing requests to the app instance.\
24. **Test with real Request objects**: Create `Request` instances with proper headers, method, and body for integration tests.\
25. **Test middleware in isolation**: Create mock contexts to test middleware behavior independently.\
26. **Test status codes and headers**: Verify response status, headers, and body content in assertions.

### Helper Usage

27. **Use built-in helpers**: Import cookie, streaming, JWT helpers from `hono/*` for common tasks.\
28. **Factory helpers for DI**: Use `createFactory()` to create reusable handler and middleware factories with shared types.\
29. **Adapter helpers for runtime**: Use `env()` from `hono/adapter` to access environment variables across runtimes.\
30. **Testing helper for RPC**: Use `testClient()` from `hono/testing` for type-safe client testing in RPC mode.

------------------------------------------------------------------------

# Database & Schema Management

-   **Schema Definition**: Define tables in `src/db/schema/*.ts` using Drizzle ORM TypeScript syntax.\
-   **Migrations**: Generate with `drizzle-kit generate:pg`, apply with `drizzle-kit up:pg`.\
-   **Connection**: Single Drizzle client in `src/db/index.ts` with connection pooling.\
-   **Row-Level Security**: Enable RLS on all tables, rely on Supabase Auth for access control.

------------------------------------------------------------------------

# Middleware & Helpers

## Built-in Middleware

Hono provides powerful built-in middleware for common tasks:

-   **Logger**: Request/response logging with `hono/logger`
-   **CORS**: Cross-origin resource sharing with `hono/cors`
-   **Bearer Auth**: Token-based authentication with `hono/bearer-auth`
-   **Basic Auth**: HTTP basic authentication with `hono/basic-auth`
-   **JWT**: JSON Web Token authentication with `hono/jwt`
-   **Body Limit**: Request size limiting with `hono/body-limit`
-   **Compress**: Response compression with `hono/compress`
-   **ETag**: Cache validation with `hono/etag`
-   **Secure Headers**: Security headers with `hono/secure-headers`

**Usage Pattern**:

```typescript
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'

app.use('*', logger())
app.use('/api/*', cors())
```

## Custom Middleware

Create custom middleware with `createMiddleware()` from `hono/factory`:

```typescript
import { createMiddleware } from 'hono/factory'

const timing = createMiddleware(async (c, next) => {
  const start = Date.now()
  await next()
  const end = Date.now()
  c.res.headers.set('X-Response-Time', `${end - start}ms`)
})
```

**Key Points**:
- Middleware executes before handler (top-down) and after handler (bottom-up, onion model)
- Call `await next()` to invoke the next middleware or handler in the chain
- Use `c.set()` to pass data to downstream handlers
- Define `Variables` type for type-safe context access

## Helper Functions

Hono provides helper functions for common operations:

-   **Cookie**: Get/set cookies with `hono/cookie`
-   **JWT**: Sign/verify tokens with `hono/jwt`
-   **Streaming**: Stream responses with `hono/streaming`
-   **Accepts**: Content negotiation with `hono/accepts`
-   **Factory**: Create reusable components with `hono/factory`

**Example**:

```typescript
import { getCookie, setCookie } from 'hono/cookie'

app.get('/session', (c) => {
  const sessionId = getCookie(c, 'session')
  setCookie(c, 'last-visit', new Date().toISOString())
  // ...
})
```

**References**:
- [Hono Middleware Guide](https://hono.dev/docs/guides/middleware)
- [Hono Helpers Guide](https://hono.dev/docs/guides/helpers)

------------------------------------------------------------------------

# Supabase Integration

-   **Client Configuration**: Service role key for server-side operations, anon key for client-side.\
-   **Auth Service**: Abstract Supabase auth operations in `infra/services/supabase-auth.service.ts`.\
-   **Database Access**: Use Drizzle ORM for complex queries, Supabase client for auth operations.\
-   **Security**: Never expose service role keys to client-side code.

------------------------------------------------------------------------

# Example feature workflow

1.  **Domain**: Define `MagicLinkAttempt` entity and `EmailAddress` value object in `domain/entities/`.\
2.  **Domain Service**: Add `RateLimitPolicy` for business rules in `domain/services/`.\
3.  **Repository**: Implement `MagicLinkAttemptRepository` with Drizzle queries in `infra/repositories/`.\
4.  **Use Case**: Create `SendMagicLinkUseCase` orchestrating domain logic and repository in `application/use-cases/`.\
5.  **API Handler**: Wire dependencies and handle HTTP in `api/handlers/magic-link-request.handler.ts`.\
    - Import `zValidator` from `@hono/zod-validator` for input validation.\
    - Instantiate repository and service dependencies.\
    - Extract validated data with `c.req.valid('json')` or `c.req.valid('form')`.\
    - Handle errors with `HTTPException` for consistent error responses.\
6.  **Routes**: Add route to Hono app in `api/routes.ts`.\
    - Chain routes directly: `authApp.post('/magic-link/request', handler)`.\
    - Export route type for RPC: `export type AuthAppType = typeof authApp`.\
7.  **Tests**: Unit test domain logic, integration test handler with real database.\
    - Use `app.request()` to test handlers end-to-end.\
    - Mock environment variables with third parameter.\
    - Verify status codes, headers, and response body.\
8.  **Constants**: Define rate limits and cooldowns in `constants.ts`.\
9.  **Middleware**: Add any cross-cutting concerns (logging, CORS) before route handlers.

**References**: 
- [Hono Validation](https://hono.dev/docs/guides/validation)
- [Hono Testing](https://hono.dev/docs/guides/testing)
- [Hono Helpers](https://hono.dev/docs/guides/helpers)

------------------------------------------------------------------------

# Final quick checklist

-   [ ] Bounded contexts organized under `src/contexts/`\
-   [ ] DDD layering: domain/ → application/ → infra/ → api/\
-   [ ] Manual DI wiring in API handlers (or `createFactory()` for complex cases)\
-   [ ] Domain entities with validation and factories\
-   [ ] Use cases orchestrating domain and repositories\
-   [ ] Repository implementations with domain object mapping\
-   [ ] Thin API handlers: validation → use-case execution → response\
-   [ ] Routes chained for type inference (RPC support)\
-   [ ] Input validation with Zod + `zValidator` middleware\
-   [ ] Error handling with `HTTPException` and global `app.onError()`\
-   [ ] Middleware registered before handlers (logger, CORS, auth)\
-   [ ] Context variables typed with `Variables` generics\
-   [ ] Constants separated by context\
-   [ ] Comprehensive Vitest test coverage\
-   [ ] Tests use `app.request()` for end-to-end validation\
-   [ ] Drizzle ORM for database operations\
-   [ ] Supabase integration abstracted in infra layer\
-   [ ] Structured logging throughout all layers\
-   [ ] No blocking operations in request/response cycle\
-   [ ] Background jobs for long-running operations

**Best Practices Reference**: [Hono Best Practices](https://hono.dev/docs/guides/best-practices)