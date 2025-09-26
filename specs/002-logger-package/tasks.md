# Tasks for feature: @yesod/logger

All tasks are ordered and include file paths and actionable steps. Tasks marked [P] can be executed in parallel when dependencies allow.

T001 — Setup package scaffold (setup)
- Path: /packages/logger/
- Description: Create package skeleton, TypeScript config, and initial package.json for `@yesod/logger`.
- Actions:
  1. Create directory `packages/logger`.
  2. Add `package.json` with name `@yesod/logger`, version `0.0.0`, license, scripts: `build`, `test`, `lint`, `prepare`.
  3. Add `tsconfig.json` extending the workspace root (or copy minimal settings).
  4. Add `.npmignore` or appropriate files to exclude tests/source if publishing.
  5. Commit scaffold to branch `002-logger-package`.

T002 — Install runtime & dev dependencies (setup) [P]
- Path: /packages/logger/package.json
- Description: Add runtime and dev dependencies to the new package.
- Actions:
  1. Add runtime dependencies: `pino`, `@sentry/node`.
  2. Add dev dependencies: `pino-pretty`, `vitest`, `@types/node`, `ts-node` (if useful), and `fast-safe-stringify` (or similar) for safe serialization.
  3. Use pnpm workspace by running from repo root: `pnpm -w add -w --filter ./packages/logger pino @sentry/node` and `pnpm -w add -D --filter ./packages/logger pino-pretty vitest fast-safe-stringify @types/node`.

T003 — Add logger types and interfaces (testable) [P]
- Path: /packages/logger/src/types.ts
- Description: Implement TypeScript interfaces for `LoggerConfig` and `LogEntry` as specified in `data-model.md`.
- Actions:
  1. Create `src/types.ts` and export `LoggerConfig` and `LogEntry` interfaces.
  2. Add validation helper signatures (e.g., `validateConfig(cfg: Partial<LoggerConfig>): LoggerConfig`).
  3. Add a unit test skeleton at `/packages/logger/__tests__/types.test.ts` asserting types compile (TS compile) and that `validateConfig` enforces required fields.

T004 — Contract test: public API surface (TDD) [P]
- Path: /specs/002-logger-package/contracts/public-api.md → test file: /packages/logger/__tests__/contract.public-api.test.ts
- Description: Create a failing contract test that verifies `createLogger` returns an object with required methods.
- Actions:
  1. Create test `__tests__/contract.public-api.test.ts` that imports from `packages/logger/src/index.ts` and asserts methods `info`, `warn`, `error`, `captureException` exist.
  2. Wire the test to run via `pnpm -w test --filter ./packages/logger` (expect failing since implementation doesn't exist yet).

T005 — Implement createLogger factory (core)
- Path: /packages/logger/src/index.ts
- Description: Implement `createLogger(config?: LoggerConfig): Logger` returning the logger instance with methods wired to pino and conditional Sentry init.
- Actions:
  1. Implement `createLogger` that:
     - Validates/normalizes config using `validateConfig`.
     - Instantiates a Pino logger with provided level, service and environment meta.
     - If `sentryDsn` present and not yet initialized, call `Sentry.init({...})` with environment and sampleRate.
     - Expose methods `info`, `warn`, `error`, `captureException`.
  2. Ensure `captureException` logs via `pino.error` and calls `Sentry.captureException(err, { extra: context })` asynchronously.
  3. Create a default export and an exported factory `createLogger`.

T006 — Unit tests: logger behavior (TDD) [P]
- Path: /packages/logger/__tests__/logger.behavior.test.ts
- Description: Tests for JSON output, captureException behavior with and without SENTRY_DSN.
- Actions:
  1. Mock pino destination (or use pino's pretty print to a buffer) and mock Sentry SDK.
  2. Test: `info` emits a JSON-like line with fields: timestamp, level, message, service, environment.
  3. Test: `captureException` calls `Sentry.captureException` when DSN is configured and does not throw when DSN is absent.

T007 — Safe serialization & large-context handling (core)
- Path: /packages/logger/src/serializers.ts
- Description: Implement safe serialization for context objects (avoid circular references, truncate very large fields).
- Actions:
  1. Add `serializers.ts` with a `safeSerialize(obj, options?)` using `fast-safe-stringify` or `flatted`, and apply max length truncation (e.g., 4KB per field) for large strings.
  2. Integrate serializers into pino configuration.

T008 — Smoke script & quickstart integration (integration)
- Path: /packages/logger/scripts/smoke.ts and /specs/002-logger-package/quickstart.md
- Description: Add a smoke script that imports `createLogger`, logs a message and captures a test exception.
- Actions:
  1. Create `scripts/smoke.ts` that creates a logger with `prettyPrint` set per env and runs `info` and `captureException`.
  2. Add a small README note calling `node dist/scripts/smoke.js` after build.

T009 — Integrate logger into one app (proof-of-concept) (sequential)
- Path: /apps/yesod-api/src/server.ts (or the relevant entry file)
- Description: Add workspace dependency and initialize logger in the app startup.
- Actions:
  1. Add `@yesod/logger` as a workspace dependency in `apps/yesod-api/package.json` (pnpm workspace: add via filter or workspace: protocol).
  2. Initialize the logger in server entrypoint: `import logger from '@yesod/logger'` and `logger.info('server starting')`.
  3. Replace a few `console.log` calls with `logger.info`/`logger.error`.

T010 — Nuxt app Sentry integration guidance (doc) [P]
- Path: /apps/shaliah/ (documentation only)
- Description: Document how to wire `@sentry/nuxt` in `apps/shaliah` and how it interacts with `@yesod/logger` for server-side captures.
- Actions:
  1. Create `docs/shaliah-sentry.md` describing where to add `@sentry/nuxt` in `nuxt.config.ts` and how to call `logger.captureException` on the server.

T011 — Linting, formatting, and CI integration (polish)
- Path: Root workspace config (.eslintrc, .prettierrc), /packages/logger/package.json
- Description: Ensure new package follows workspace ESLint and Prettier rules and that tests run in CI
- Actions:
  1. Add lint and test scripts to `packages/logger/package.json` consistent with workspace scripts.
  2. Update CI config if necessary to include `pnpm -w test --filter ./packages/logger`.

T012 — Documentation: README and env var reference (polish) [P]
- Path: /packages/logger/README.md and /specs/002-logger-package/quickstart.md
- Description: Write usage examples, env var documentation, and migration notes for consumers.
- Actions:
  1. Create README with examples (from quickstart.md) and environment variable descriptions.
  2. Add a short migration note instructing how to replace console logs with `@yesod/logger`.

T013 — Release checklist & workspace linking (polish)
- Path: repository root and /packages/logger/package.json
- Description: Ensure the package is linked in pnpm workspace and prepare for release (internal).
- Actions:
  1. Confirm `packages` path is included in `pnpm-workspace.yaml`.
  2. Ensure `package.json` name matches `@yesod/logger` and has a version.
  3. Tag the branch or create a draft release note for the new package.

Parallel task groups (examples)
- Group A [P]: T002, T003, T004, T006, T007, T012 can run in parallel (independent files and tests).
- Group B [sequential]: T005 -> T006 -> T008 (implementation, then tests, then smoke script) must be sequential.

Agent commands / examples
- To scaffold package (T001): run (repo root)
  - mkdir -p packages/logger && cd packages/logger && git init -q --bare? # (create files and commit on feature branch)
- To add deps (T002): run (repo root)
  - pnpm -w add -w --filter ./packages/logger pino @sentry/node
  - pnpm -w add -D --filter ./packages/logger pino-pretty vitest fast-safe-stringify @types/node
- To run contract tests (T004): run (repo root)
  - pnpm -w test --filter ./packages/logger
