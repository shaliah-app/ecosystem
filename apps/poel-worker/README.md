# ⚙️ Poel Worker

A background job processing worker for the Yesod ecosystem, built with **Deno +
TypeScript**. Handles long-running tasks like audio fingerprinting, stem
separation, and metadata processing using a PostgreSQL-based job queue.

## 🚀 Features

- **Asynchronous Job Processing** - Handle long-running tasks without blocking
  the API
- **PostgreSQL Queue** - Direct database queue implementation with
  `FOR UPDATE SKIP LOCKED`
- **Modular Handler Pattern** - Clean, scalable structure for different job
  types
- **Deno Runtime** - Secure, modern JavaScript/TypeScript runtime
- **Structured Logging** - JSON logs with job context and observability
- **Health Checks** - HTTP endpoint for monitoring and orchestration
- **Type Safety** - Full TypeScript with Zod validation
- **Retry & Backoff** - Automatic retry with exponential backoff

## 🛠️ Technology Stack

- **Runtime**: [Deno](https://deno.com/) (TypeScript first)
- **Database**: Supabase (PostgreSQL) with Drizzle ORM
- **Queue**: Direct PostgreSQL with `FOR UPDATE SKIP LOCKED` patterns
- **Validation**: [Zod](https://zod.dev/) for runtime schema parsing
- **Logging**: Structured JSON logging
- **Testing**: Deno test framework
- **Package Management**: Deno modules and npm compatibility

## 📋 Prerequisites

- Deno 1.40+
- Supabase project with database
- PostgreSQL database

## ⚙️ Setup

### 1. Install Deno

```bash
# Using curl
curl -fsSL https://deno.land/install.sh | sh

# Or using brew (macOS)
brew install deno

# Verify installation
deno --version
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Fill in your Supabase configuration:

```env
# Database Configuration (Supabase)
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# Supabase Configuration
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Worker Configuration
DENO_ENV=development
WORKER_CONCURRENCY=2
JOB_TIMEOUT_MS=300000
HEALTH_CHECK_PORT=8080
```

### 3. Database Setup

The job queue schema is managed in the `shaliah-next` application. Ensure the
database migrations are applied there first.

## 🏃‍♂️ Running the Worker

### Development Mode

```bash
deno task start:local
```

### Production Mode

```bash
deno task start
```

### Graceful Shutdown

The worker handles graceful shutdown automatically:

- Press `Ctrl+C` (SIGINT) or send SIGTERM
- Worker stops accepting new jobs
- Waits for running jobs to complete
- Exits cleanly

## 📁 Project Structure

```
poel-worker/
├── src/
│   ├── main.ts              # Application bootstrap and health server
│   ├── config.ts            # Environment configuration with Zod
│   ├── supabase.ts          # Supabase client setup
│   ├── queue/
│   │   └── index.ts         # Queue manager with polling
│   ├── jobs/
│   │   ├── index.ts         # Job dispatcher and registry
│   │   ├── processNewRecord.ts # Example job handler
│   │   └── cleanupAuthTokens.ts # Scheduled cleanup job
│   ├── types/
│   │   └── job.ts           # Job type definitions
│   └── utils/
│       ├── logger.ts        # Structured logging
│       └── metrics.ts       # Basic metrics collection
├── tests/
│   └── *.test.ts            # Unit tests
├── deno.json                # Deno configuration and tasks
├── import_map.json          # Import map for workspace packages
└── .env.example             # Environment variables template
```

## 🏗️ Architecture

### Job Handler Contract

Each job type follows a strict contract:

```typescript
import { z } from "npm:zod@4.1.11";
import type { JobContext } from "../types/job.ts";

// Define schema
const myJobSchema = z.object({
  // ... payload validation
});

// Export contract
export const jobType = "my_job_type" as const;
export const schema = myJobSchema;

// Handler function
export async function process(
  payload: z.infer<typeof schema>,
  ctx: JobContext,
) {
  // Process the job
}
```

### Queue Processing

The worker uses PostgreSQL's `FOR UPDATE SKIP LOCKED` for reliable job
processing:

1. **Polling**: Regularly queries for pending jobs
2. **Locking**: Uses row-level locking to prevent duplicate processing
3. **Processing**: Dispatches to appropriate handler with timeout
4. **Completion**: Updates job status and handles retries/backoff

### Retry & Error Handling

- **Automatic Retries**: Failed jobs retry with exponential backoff
- **Max Attempts**: Configurable retry limit (default: 3)
- **Dead Letter**: Failed jobs marked as `failed` after max attempts
- **Logging**: Comprehensive error logging with job context

## 🔧 Available Job Types

### `process_new_record`

Processes newly created records in the system.

**Job Data:**

```typescript
{
  record_id: number,
  record_type?: string,
  metadata?: Record<string, any>
}
```

**Example Usage:**

```typescript
import { queueManager } from "./src/queue/index.ts";

await queueManager.enqueueJob("process_new_record", {
  record_id: 123,
  record_type: "song",
  metadata: { source: "upload" },
});
```

### `cleanup_auth_tokens`

Scheduled job to clean up expired authentication tokens.

**Job Data:**

```typescript
{}
```

**Example Usage:**

```typescript
await queueManager.enqueueJob("cleanup_auth_tokens", {}, {
  runAt: new Date(Date.now() + 3600000), // Run in 1 hour
});
```

## 📊 Monitoring & Observability

### Health Checks

The worker exposes a health check endpoint:

```bash
curl http://localhost:8080/health
```

Response:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "service": "poel-worker",
  "environment": "development"
}
```

### Structured Logging

All logs are JSON formatted:

```json
{
  "level": "info",
  "ts": "2024-01-01T12:00:00.000Z",
  "msg": "Job completed successfully",
  "jobId": "uuid",
  "jobType": "process_new_record",
  "service": "poel-worker",
  "environment": "development"
}
```

## 🧪 Testing

Run the test suite:

```bash
deno task test
```

### Test Structure

- **Unit Tests**: Handler functions and utilities
- **Integration Tests**: Queue processing and database operations
- **Mock Context**: Isolated testing without external dependencies

## 🚀 Deployment

### Environment Variables

Ensure all environment variables are set in production:

- `DATABASE_URL` - Supabase connection string
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `DENO_ENV` - Set to `production`
- `JOB_TIMEOUT_MS` - Job processing timeout
- `HEALTH_CHECK_PORT` - Health check server port

### Process Management

For production, consider using process managers or container orchestration:

```dockerfile
FROM denoland/deno:1.40
WORKDIR /app
COPY . .
RUN deno cache src/main.ts
CMD ["deno", "task", "start"]
```

### Security

Deno requires explicit permissions:

```bash
# Development (more permissive)
deno task start:local

# Production (least privilege)
deno run --allow-env --allow-net --allow-read --unstable src/main.ts
```

## 🤝 Adding New Job Types

1. **Create Handler** in `src/jobs/`:
   ```typescript
   import { z } from "npm:zod@4.1.11";
   import type { JobContext } from "../types/job.ts";

   export const jobType = "my_new_job" as const;
   export const schema = z.object({/* ... */});

   export async function process(
     payload: z.infer<typeof schema>,
     ctx: JobContext,
   ) {
     // Implement job logic
   }
   ```

2. **Register Handler** in `src/main.ts`:
   ```typescript
   import { registerJobHandler } from "./jobs/index.ts";
   import { jobType, process, schema } from "./jobs/myNewJob.ts";

   registerJobHandler({
     type: jobType,
     schema,
     handler: process,
   });
   ```

3. **Create Tests** in `tests/`:
   ```typescript
   import { jobType, process, schema } from "../src/jobs/myNewJob.ts";

   Deno.test("myNewJob - processes correctly", async () => {
     // Test implementation
   });
   ```

## 📈 Scaling

The worker is designed to be horizontally scalable:

- **Multiple Instances**: Run multiple worker processes
- **Load Balancing**: PostgreSQL queue automatically distributes jobs
- **Connection Pooling**: Efficient database connection usage
- **Resource Limits**: Configurable timeouts and concurrency

## 🔍 Troubleshooting

### Common Issues

**Worker won't start:**

- Check `DATABASE_URL` is correct and accessible
- Verify Supabase credentials
- Ensure Deno has network permissions

**Jobs not processing:**

- Check worker logs for errors
- Verify job data matches handler schema
- Check database connectivity and permissions

**High memory usage:**

- Reduce job timeout or concurrency
- Monitor for memory leaks in handlers
- Check for large payloads in job data

## 📝 Development Workflow

### Running Locally

```bash
# Start worker
deno task start:local

# Run tests
deno task test

# Format code
deno task fmt

# Lint code
deno task lint
```

### Adding Features

1. Define job contract (schema + handler)
2. Register handler in `main.ts`
3. Add tests
4. Update documentation
5. Test integration

## 📝 License

This project is part of the Yesod ecosystem.
