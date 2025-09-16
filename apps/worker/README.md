# ⚙️ Yesod Worker

A background job processing worker for the Yesod ecosystem, built with pg-boss and Supabase. Handles long-running tasks like audio fingerprinting, stem separation, and metadata processing.

## 🚀 Features

- **Asynchronous Job Processing** - Handle long-running tasks without blocking the API
- **Reliable Queue System** - pg-boss provides built-in retries, scheduling, and persistence
- **Modular Handler Pattern** - Clean, scalable structure for different job types
- **Graceful Shutdown** - Prevents data loss during deployments
- **Production Ready** - Comprehensive error handling and monitoring
- **Supabase Integration** - Uses existing database infrastructure

## 🛠️ Technology Stack

- **Job Queue**: [pg-boss](https://github.com/timgit/pg-boss) - PostgreSQL-based job queue
- **Database**: Supabase (PostgreSQL) with connection pooling
- **Runtime**: Node.js with TypeScript
- **Architecture**: Modular handler pattern with graceful shutdown

## 📋 Prerequisites

- Node.js 18+
- pnpm package manager
- Supabase project with database
- PostgreSQL database (via Supabase)

## ⚙️ Setup

### 1. Install Dependencies

```bash
cd apps/worker
pnpm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Fill in your Supabase configuration:

```env
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
NODE_ENV=development
```

### 3. Database Setup

pg-boss will automatically create its required tables when it starts. No manual database setup is required.

## 🏃‍♂️ Running the Worker

### Development Mode

```bash
pnpm run dev
```

### Production Mode

```bash
pnpm run build
pnpm run start
```

### Graceful Shutdown

The worker handles graceful shutdown automatically:

- Press `Ctrl+C` (SIGINT) or send SIGTERM
- Worker stops accepting new jobs
- Waits for running jobs to complete (10 seconds)
- Exits cleanly

## 📁 Project Structure

```
src/
├── index.ts              # Main entry point and job handler registration
├── boss.ts               # pg-boss initialization and configuration
└── handlers/             # Job-specific handler functions
    └── processNewRecord.ts # Placeholder handler for new records
```

## 🏗️ Architecture

### Modular Handler Pattern

Each job type has its own handler function:

```typescript
// src/handlers/processNewRecord.ts
export async function processNewRecord(job: Job<ProcessNewRecordData>) {
  // Process the job
  return result
}
```

### Job Registration

Handlers are registered in the main index.ts:

```typescript
// Register job handlers
await boss.work('process_new_record', processNewRecord)
```

### Graceful Shutdown

The worker implements comprehensive shutdown logic:

```typescript
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
```

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
await boss.send('process_new_record', {
  record_id: 123,
  record_type: 'song',
  metadata: { source: 'upload' }
})
```

## 📊 Monitoring & Logging

The worker provides comprehensive logging:

- **Startup**: Connection status and handler registration
- **Job Processing**: Job start/completion with timing
- **Errors**: Detailed error logging with job context
- **Shutdown**: Graceful shutdown progress

## 🚀 Deployment

### Environment Variables

Ensure all environment variables are set in your deployment:

- `DATABASE_URL` - Supabase connection string (use connection pooler)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `NODE_ENV` - Set to `production` for production deployment

### Process Management

For production, consider using PM2:

```bash
npm install -g pm2
pm2 start dist/index.js --name yesod-worker
pm2 save
pm2 startup
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
CMD ["node", "dist/index.js"]
```

## 🤝 Adding New Job Types

1. **Create Handler Function** in `src/handlers/`:
   ```typescript
   export async function myNewJob(job: Job<MyJobData>) {
     // Process the job
   }
   ```

2. **Register Handler** in `src/index.ts`:
   ```typescript
   await boss.work('my_new_job', myNewJob)
   ```

3. **Define Job Data Interface**:
   ```typescript
   interface MyJobData {
     // Define your job data structure
   }
   ```

## 📈 Scaling

The worker is designed to be horizontally scalable:

- **Multiple Instances**: Run multiple worker processes
- **Load Balancing**: pg-boss automatically distributes jobs
- **Connection Pooling**: Uses Supabase connection pooler
- **Resource Limits**: Configurable concurrency per worker

## 🔍 Troubleshooting

### Common Issues

**Worker won't start:**
- Check DATABASE_URL is correct
- Verify Supabase connection
- Ensure database is accessible

**Jobs not processing:**
- Check worker logs for errors
- Verify job data format matches handler expectations
- Check database connectivity

**High memory usage:**
- Reduce WORKER_CONCURRENCY
- Monitor job processing times
- Check for memory leaks in handlers

## 📝 License

This project is part of the Yesod ecosystem.