import type {
  InferInsertModel,
  InferSelectModel,
} from 'drizzle-orm'
import { jobQueue } from "@yesod/shaliah-next/db/schema";

// Infer TypeScript types from Drizzle schema
export type Job = InferSelectModel<typeof jobQueue>;
export type NewJob = InferInsertModel<typeof jobQueue>;

// Job context passed to handlers
export interface JobContext {
  jobId: string;
  logger: {
    info: (message: string, meta?: Record<string, any>) => void;
    warn: (message: string, meta?: Record<string, any>) => void;
    error: (message: string, meta?: Record<string, any>) => void;
  };
  supabase: any; // Supabase client
}

// Job handler function signature
export type JobHandler<T = any> = (
  payload: T,
  ctx: JobContext,
) => Promise<void>;

// Job handler registry entry
export interface JobHandlerEntry {
  type: string;
  schema: any; // Zod schema
  handler: JobHandler;
}
