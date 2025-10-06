import { config } from "../config.ts";

// Simple structured logger for Deno
export interface Logger {
  info: (message: string, meta?: Record<string, any>) => void;
  warn: (message: string, meta?: Record<string, any>) => void;
  error: (message: string, meta?: Record<string, any>) => void;
  child: (meta: Record<string, any>) => Logger;
}

class DenoLogger implements Logger {
  private meta: Record<string, any> = {};

  constructor(initialMeta: Record<string, any> = {}) {
    this.meta = {
      ...initialMeta,
      service: "poel-worker",
      environment: config.environment,
    };
  }

  private log(level: string, message: string, meta?: Record<string, any>) {
    const logEntry = {
      level,
      ts: new Date().toISOString(),
      msg: message,
      ...this.meta,
      ...meta,
    };
    console.log(JSON.stringify(logEntry));
  }

  info(message: string, meta?: Record<string, any>) {
    this.log("info", message, meta);
  }

  warn(message: string, meta?: Record<string, any>) {
    this.log("warn", message, meta);
  }

  error(message: string, meta?: Record<string, any>) {
    this.log("error", message, meta);
  }

  child(additionalMeta: Record<string, any>): Logger {
    return new DenoLogger({ ...this.meta, ...additionalMeta });
  }
}

// Create and export default logger instance
export const logger = new DenoLogger();
