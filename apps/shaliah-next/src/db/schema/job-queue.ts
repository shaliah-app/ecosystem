import { pgTable, uuid, text, jsonb, integer, timestamp, index } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// Job status enum
export const jobStatusEnum = ['pending', 'processing', 'done', 'failed', 'retrying'] as const
export type JobStatus = typeof jobStatusEnum[number]

// Job queue table schema
export const jobQueue = pgTable('job_queue', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  type: text('type').notNull(), // Job handler identifier
  payload: jsonb('payload').notNull(), // Job-specific data
  status: text('status', { enum: jobStatusEnum }).notNull().default('pending'),
  attempts: integer('attempts').notNull().default(0), // Retry count
  priority: integer('priority').notNull().default(0), // Processing order (higher = more priority)
  runAt: timestamp('run_at', { withTimezone: true }), // Deferred execution
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  statusIdx: index('job_queue_status_idx').on(table.status),
  runAtIdx: index('job_queue_run_at_idx').on(table.runAt),
  priorityIdx: index('job_queue_priority_idx').on(table.priority),
  typeIdx: index('job_queue_type_idx').on(table.type),
}))