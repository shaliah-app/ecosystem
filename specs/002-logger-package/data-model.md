# Phase 1 — Data Model: @yesod/logger

This package focuses on runtime behavior and configuration (no persistent storage). The "data model" here defines configuration objects and log entry shape used across services.

## Entities

- LoggerConfig
  - description: Configuration object used to create or configure a logger instance
  - fields:
    - serviceName: string (required)
    - environment: string (default: process.env.NODE_ENV || 'development')
    - level: 'debug' | 'info' | 'warn' | 'error' (default: 'info' in production)
    - sentryDsn?: string
    - sentryEnvironment?: string
    - sampleRate?: number
    - prettyPrint?: boolean (default: true in development)

- LogEntry
  - description: Standardized shape emitted to stdout/stderr
  - fields:
    - timestamp: ISO string
    - level: string
    - message: string
    - service: string
    - environment: string
    - context?: object
    - meta?: object

## Validation Rules
- `serviceName` must be non-empty
- `level` must be one of the allowed strings
- `sampleRate` if present must be in (0,1]

## State/Runtime Considerations
- Logger instances are lightweight objects and should be created once per service process (singleton pattern or exported factory invoked once).
