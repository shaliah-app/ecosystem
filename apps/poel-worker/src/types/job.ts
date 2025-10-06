// PGMQ message structure from Supabase Queues
export interface PGMQMessage {
  msg_id: number;
  message: {
    type: string;
    payload: any;
  };
  read_ct: number;
  enqueued_at: string;
  vt: string; // visibility timeout
}

// Job message interface for the worker (transformed from PGMQ)
export interface JobMessage {
  id: string; // msg_id as string for compatibility
  type: string;
  payload: any;
  readCount: number;
}

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
