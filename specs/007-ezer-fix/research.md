# Research: Ezer Bot Dependency Fix

**Feature**: 007-ezer-fix  
**Date**: 2025-01-27  
**Status**: Complete

## Research Questions

### 1. How to implement health checks in grammY middleware?

**Decision**: Use grammY middleware pattern with HTTP health check to Shaliah endpoint  
**Rationale**: grammY middleware runs before handlers, perfect for dependency checking. HTTP check is simple and reliable.  
**Alternatives considered**: 
- Database connection check (overkill for simple availability)
- WebSocket connection (complex, not needed)
- File system check (not applicable for web app)

### 2. What's the best way to implement development mode in grammY?

**Decision**: Use standard NODE_ENV environment variable (development/test bypasses dependency check)  
**Rationale**: Standard Node.js/Deno practice. NODE_ENV=development/test is the conventional way to enable development features.  
**Alternatives considered**:
- Custom environment variable (non-standard, adds complexity)
- Command-line flags (complex for bot deployment)
- Database configuration (overkill for simple flag)
- Runtime configuration API (unnecessary complexity)

### 3. How to handle Shaliah health check endpoint?

**Decision**: Simple HTTP GET request to Shaliah health endpoint with timeout  
**Rationale**: Standard REST health check pattern. Timeout prevents hanging requests.  
**Alternatives considered**:
- Complex health check with detailed status (overkill for simple availability)
- WebSocket health check (unnecessary complexity)
- Database query to check Shaliah tables (coupling, not needed)

### 4. What error message format works best for Telegram users?

**Decision**: Friendly, non-technical message with clear next steps  
**Rationale**: Users need to understand the situation without technical jargon. Clear guidance on what to do next.  
**Alternatives considered**:
- Technical error messages (confusing for users)
- Generic "service unavailable" (not helpful)
- Detailed technical explanations (overwhelming)

### 5. How to implement timeout and retry logic?

**Decision**: 5-second timeout with single attempt (no retry)  
**Rationale**: Fast failure is better than slow responses. Single attempt keeps it simple.  
**Alternatives considered**:
- Multiple retry attempts (adds complexity and delay)
- Exponential backoff (overkill for simple health check)
- No timeout (risky, could hang indefinitely)

## Technical Decisions

### Health Check Implementation
- **Method**: HTTP GET request to Shaliah health endpoint
- **Timeout**: 5 seconds maximum
- **Retry**: None (fail fast)
- **Response**: Simple 200 OK check

### Development Mode
- **Configuration**: Environment variable `NODE_ENV=development` or `NODE_ENV=test`
- **Behavior**: Bypass all dependency checks
- **Default**: `production` (dependency check enabled)

### Error Handling
- **Network errors**: Treat as Shaliah offline
- **Timeout**: Treat as Shaliah offline  
- **Non-200 response**: Treat as Shaliah offline
- **Logging**: Log all dependency check results

### Middleware Integration
- **Position**: After session/i18n, before feature modules
- **Scope**: All user interactions
- **Bypass**: Development/test mode only

## Implementation Approach

1. **Create dependency middleware**: New composer for Shaliah health checks
2. **Add configuration**: Use NODE_ENV for development mode detection
3. **Update bot.ts**: Register middleware in correct order
4. **Add translations**: Error messages in pt-BR and en-US
5. **Add tests**: Vitest tests for all scenarios

## Dependencies

- **HTTP client**: Built-in `fetch` or `node-fetch` for health checks
- **Configuration**: `process.env.NODE_ENV`
- **Logging**: Existing `@yesod/logger` package
- **Translations**: Existing `@grammyjs/i18n` setup

## Risks and Mitigations

- **Risk**: Shaliah health endpoint not available
  - **Mitigation**: Graceful fallback to offline mode with clear error message
- **Risk**: Health check adds latency
  - **Mitigation**: 5-second timeout, single attempt, fail fast
- **Risk**: Development mode accidentally enabled in production
  - **Mitigation**: Standard NODE_ENV practice, clear documentation
