
# Poel Worker — Architecture & Best Practices
**Poel (poel-worker)** — Deno + TypeScript background worker that consumes jobs from Supabase (Postgres queue) and integrates with other apps (Next.js server, Telegram bot). 
This document follows the structure and conventions used in your example guides. See the Telegram Bot Architecture Guide and Frontend Architecture Guide for layout and tone. 

---

## Table of contents
1. Overview
2. Architectural philosophy
3. Tech stack
4. Project structure
5. Supabase Queues — patterns & best practices
6. Job lifecycle & handlers
7. Validation with Zod
8. Logging & observability
9. Tooling (format, lint, test, tasks)
10. Scheduling (optional)
11. Deployment & running
12. Security & Deno permission notes
13. LLM reminder for developer workflow
14. Checklist

---

## 1. Overview
Poel is a small, focused background worker service implemented with **Deno + TypeScript**. Its responsibilities:
- Consume jobs produced by two producers (Next.js server + Telegram bot) via a Supabase/Postgres queue.
- Validate job payloads, process jobs (I/O or CPU-bound), update job status in DB.
- Be horizontally scalable (multiple worker instances) and observable.

Design goals:
- Minimal indirection — job handlers are explicit and testable.
- Secure-by-default: follow least-privilege when launching the runtime.
- Small surface area: prefer built-in Deno APIs and tiny, well-known libraries.

---

## 2. Architectural philosophy
- **Feature-centered job handlers**: each job type gets a single handler file with a small public `process(payload, ctx)` function.
- **Queue abstraction**: a thin adapter that hides Supabase/Postgres specifics (polling vs LISTEN/NOTIFY).
- **Small domain model**: job shape + states (`pending`, `processing`, `done`, `failed`, `retrying`).
- **Observability-first**: structured logs and metrics hooks in every handler.

This approach mirrors the pragmatic, module-based style used in your other projects (Ezer Bot, Shaliah Next). 

---

## 3. Tech stack
- **Runtime**: Deno (TypeScript first)
- **DB / Queue**: Supabase (Postgres) — queue table + optionally LISTEN/NOTIFY or `SELECT ... FOR UPDATE SKIP LOCKED` patterns. Postgres-based queues are common and pragmatic for modest throughput systems.
- **Database Schema**: Consumes Drizzle ORM types from `@yesod/shaliah-next` workspace package (single source of truth for all database schema)
- **Validation**: `zod` for runtime schema parsing & type inference. 
- **Logging**: project logger (structured JSON) — keep interface small (`info`, `warn`, `error`, `child`).
- **Deno built-ins**: `fetch`, `Worker` (if using internal multi-threading), `Deno.tasks` for helper scripts. Use `deno task` for project commands. 
- **Testing**: `deno test`
- **Formatting & linting**: `deno fmt`, `deno lint`
- **Optional scheduling**: cron-like using `croner` or external scheduler / Deno Deploy scheduled triggers. 

---

## 4. Project structure (recommended)

```
poel-worker/
├── src/
│ ├── main.ts # bootstrap, queue loop or LISTEN registration
│ ├── config.ts # env + constants
│ ├── supabase.ts # Supabase client adapter
│ ├── queue/
│ │ └── index.ts # queue adapter (polling or listen)
│ ├── jobs/
│ │ ├── index.ts # registry + dispatcher
│ │ ├── processSong.ts
│ │ └── generateSlide.ts
│ ├── types/
│ │ └── job.ts # Job shapes and enums (Zod schemas live with handlers)
│ ├── utils/
│ │ ├── logger.ts
│ │ └── metrics.ts
│ └── workers/ # optional: Deno Worker thread code for CPU-bound tasks
├── tests/
│ └── *.test.ts
├── deno.json # tasks, importMap, lint/format config
├── README.md
└── .env.example
```

**Note**: Database schema and migrations are managed in the `shaliah-next`
application. This worker imports types from `@yesod/shaliah-next/db/schema`
via workspace references.

---

## 5. Database Schema & Type Sharing

### Centralized Schema Management

The database schema, including the job queue table, is **managed exclusively in
the `shaliah-next` application** using Drizzle ORM. This ensures type safety and
consistency across all applications in the ecosystem.

**Schema location**: `apps/shaliah-next/db/schema/job-queue.ts`

### Consuming Drizzle Types

This worker imports table schemas and types from the shaliah-next workspace:

```typescript
// Import the job queue table schema
import { jobQueue } from '@yesod/shaliah-next/db/schema'
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'

// Infer TypeScript types from schema
type Job = InferSelectModel<typeof jobQueue>
type NewJob = InferInsertModel<typeof jobQueue>

// Use in your queue adapter
export async function fetchNextJob(): Promise<Job | null> {
  // Query logic using the jobQueue schema
}
```

### Benefits of Centralized Schema

1. **Single source of truth**: Schema changes are made once in shaliah-next
2. **Type safety**: TypeScript types are automatically inferred from schema
3. **No drift**: Worker and producer always use the same table structure
4. **Easier migrations**: Drizzle migrations handle schema evolution

### Job Queue Table Structure

See `apps/shaliah-next/db/schema/job-queue.ts` for the authoritative schema.
Expected fields:
- `id` (uuid, primary key)
- `type` (text, job handler identifier)
- `payload` (jsonb, job-specific data)
- `status` (text enum: pending, processing, done, failed, retrying)
- `attempts` (integer, retry count)
- `priority` (integer, processing order)
- `run_at` (timestamptz, deferred execution)
- `created_at`, `updated_at` (timestamptz)

---

# 6. Queue Consumption Patterns

### 6. Queue Consumption Patterns
1. **Polling with SKIP LOCKED** (recommended for reliability & portability) 
 Worker transaction:
 - `BEGIN`
 - `SELECT id FROM job_queue WHERE status='pending' AND (run_at IS NULL OR run_at <= now()) ORDER BY priority ASC, created_at ASC FOR UPDATE SKIP LOCKED LIMIT 1`
 - update to `processing` and commit
 - process job
 - update to `done`/`failed` outside transaction

 Use advisory locks or `FOR UPDATE SKIP LOCKED` to avoid duplicate processing across instances. This is a standard pattern used for Postgres-backed queues. 

2. **LISTEN / NOTIFY** to reduce empty polls 
 - Producers `NOTIFY channel, payload` after inserting job row.
 - Workers `LISTEN` on channel and wake up to fetch and `FOR UPDATE SKIP LOCKED` the row.
 - Caveats: Notifications can be lost on DB failover and are advisory — design your consumer to always reconcile (periodic sweeps). Use LISTEN/NOTIFY to reduce latency, not as the sole source of truth. (See Postgres queue discussions.) 

### Retry & backoff
- `attempts` column + `run_at = now() + (attempts ^ 2) * interval '1 second'` (example quadratic backoff).
- Move failed jobs to a `failed_jobs` table (or mark and keep for manual inspection).

### Idempotency
- Ensure handlers are idempotent — record side-effects (e.g., external uploads, DB writes) with dedupe keys.

---

## 7. Job lifecycle & handlers

### Job handler contract
Each handler exports:
```ts
export const jobType = "process_song" as const;
export const schema = z.object({ /* ... */ });

export async function process(payload: z.infer<typeof schema>, ctx: JobContext) {
 // validate (schema.parse) — catch and set job as failed if invalid
 // do the job
}
```

### Dispatcher logic (pseudo)
- Fetch job (see queue patterns)
- Validate with Zod: `const data = schema.safeParse(job.payload)`
- If invalid → mark `failed` and include validation errors
- Set status `processing`, update `attempts += 1`
- Execute handler with timeout and cancellation support
- On success → `done`
- On failure → increment `attempts`, set `run_at` for retry or mark `failed`

### Timeouts & cancellation
- Use `AbortController` + `Promise.race` to enforce timeouts per job.
- Avoid long-blocking synchronous operations — use async APIs or spawn a Deno Worker for CPU-bound tasks. Deno's worker threads mirror the Web Worker API and are a good fit for CPU-heavy subtasks. 

---

## 8. Validation with Zod
- Validate payload at the boundary (right after reading the DB row).
- Keep Zod schemas colocated with handlers for clarity.
- Use `safeParse` in dispatch to capture and persist validation errors instead of throwing.
- Use schema `transform()` to normalize shapes when necessary.
- Leverage `z.infer<typeof schema>` to get compile-time payload types.

Reference: Zod docs. 

---

## 9. Logging & observability
- Structured logger with JSON output (timestamp, job_id, type, attempts, duration_ms, error).
- Minimal fields: `level`, `ts`, `job_id`, `type`, `msg`, `meta`.
- Capture traces/spans around job execution if you use APM (optional).
- Expose a small HTTP `/health` endpoint to check DB connectivity and worker loop status (useful in container orchestration).

---

## 10. Tooling (format, lint, test, tasks)

### deno.json tasks (suggested)
```json
{
 "tasks": {
 "start": "deno run --allow-env --allow-net --allow-read --unstable src/main.ts",
 "start:local": "deno run --allow-env --allow-net --allow-read src/main.ts",
 "test": "deno test --allow-env --allow-net",
 "fmt": "deno fmt",
 "lint": "deno lint"
 },
 "lint": { "rules": { "exclude": ["no-explicit-any"] } }
}
```
Use `deno task start` to centralize flags. `deno task` is cross-platform and recommended for developer ergonomics. 

### Formatting & linting
- `deno fmt` (runs on CI)
- `deno lint` (CI gate)

### Testing
- `deno test` with isolated DB or a local test DB. Mock external calls with lightweight HTTP interceptors or test doubles.
- Use `--allow-env` and `--allow-net` only in test tasks when required.

---

## 11. Scheduling (optional)
- For recurring jobs, prefer:
 - External scheduler (Cron in Kubernetes, GitHub Actions, Cloud Scheduler), **or**
 - Deno Deploy scheduled triggers / webhook + small trigger service. Deno Deploy has patterns for scheduled webhooks. 

If you implement an internal scheduler, persist scheduled runs in the queue table (`run_at`) and have workers check `run_at <= now()`.

---

## 12. Deployment & running

### Example run command (local / dev)
```bash
deno task start:local
# or
deno run --allow-env --allow-net --allow-read src/main.ts
```

### Production example (explicit permissions)
```bash
deno run --allow-env --allow-net=api.something.com,db-host:5432 --allow-read=./config --unstable src/main.ts
```

### Running in containers
- Build a small image using official Deno base or use `denoland/deno` image.
- Pass environment variables securely and mount secrets (avoid baking service keys).
- Health-check endpoint used by orchestrator to restart unhealthy instances.

---

## 13. Security & Deno permission notes
Deno is secure-by-default and requires explicit permission flags (e.g., `--allow-net`, `--allow-read`, `--allow-env`, `--allow-run`, `--allow-write`). Always follow least-privilege:

- For everyday operation: `--allow-env --allow-net --allow-read` (narrow `--allow-net` to hostnames/ips if possible).
- Avoid `--allow-all` in production.
- If you must run child processes, require `--allow-run` explicitly and audit calls.
- Do not execute untrusted code or shell out to arbitrary commands.

For authoritative reference see Deno security docs. 

---

## 14. LLM reminder for developer workflow
> **Note to any LLM or developer automating commands:** 
> When running the worker locally or in CI, **always** pass the required `--allow-*` flags to Deno; otherwise Deno will deny network/file access. Also **do not** run process-blocking or interactive commands inside the job handlers (e.g., prompts that wait for stdin, or blocking `while(true)` loops without yield points). Use async APIs, `AbortController` timeouts, and offload CPU-bound work to Deno Workers. See the security docs for details. 

---

## 15. Checklist
- [ ] `deno.json` with `tasks` defined
- [ ] Workspace reference to `@yesod/shaliah-next` configured
- [ ] Job queue types imported from shaliah-next schema
- [ ] Polling implemented with `FOR UPDATE SKIP LOCKED` (and optional LISTEN/NOTIFY)
- [ ] Job handlers colocated with Zod schemas
- [ ] Structured logger and `/health` endpoint
- [ ] CI: `deno fmt`, `deno lint`, `deno test`
- [ ] Production run command uses least-privilege (`--allow-net` scoped)
- [ ] Retries, backoff, and dead-letter handling implemented
- [ ] Tests for handlers and queue adapter

---

## References & further reading
- Deno security & permissions. 
- Zod documentation. 
- Postgres queue patterns (FOR UPDATE SKIP LOCKED, advisory locks, LISTEN/NOTIFY discussions). 
- Deno `deno task` guide. 
- Deno Workers (multi-threading) overview. 

---

**Document last updated:** 2025-10-06
