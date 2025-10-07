# Data Model: Ezer Bot Dependency Fix

**Feature**: 007-ezer-fix  
**Date**: 2025-01-27  
**Status**: Complete

## Overview

This feature does not require persistent data storage. The dependency check is stateless and uses only configuration and runtime state.

## Configuration Entities

### Environment Configuration
- **NODE_ENV**: Environment mode (development/test bypasses dependency checks)
- **SHALIAH_HEALTH_URL**: URL endpoint for Shaliah health check
- **DEPENDENCY_CHECK_TIMEOUT**: Timeout in milliseconds (default: 5000)

## Runtime State

### Dependency Check State
- **isOnline**: Boolean indicating Shaliah availability
- **lastCheck**: Timestamp of last health check
- **checkInProgress**: Boolean to prevent concurrent checks

### Session State (Optional)
- **lastDependencyError**: Timestamp of last dependency failure

## No Persistent Data Required

This feature is designed to be stateless:
- No database tables needed
- No persistent storage required
- Configuration via environment variables only
- Runtime state is ephemeral

## State Transitions

### Normal Operation
1. User sends message → Dependency check → Shaliah online → Process message
2. User sends message → Dependency check → Shaliah offline → Show error message

### Development/Test Mode
1. User sends message → NODE_ENV=development/test → Skip dependency check → Process message

### Health Check Flow
1. Start health check → Set checkInProgress = true
2. HTTP request to Shaliah → Success → Set isOnline = true
3. HTTP request to Shaliah → Failure/Timeout → Set isOnline = false
4. Complete health check → Set checkInProgress = false

## Validation Rules

- **NODE_ENV**: Must be one of: production, development, test
- **Health URL**: Must be valid HTTP/HTTPS URL
- **Timeout**: Must be positive integer (1-30000ms)
- **Dependency check**: Must complete within timeout period

## Error States

- **Network error**: Treat as offline
- **Timeout**: Treat as offline
- **Invalid response**: Treat as offline
- **Configuration error**: Log error, treat as offline

## Logging Requirements

- **Dependency check start**: Log with timestamp
- **Dependency check success**: Log with response time
- **Dependency check failure**: Log with error details
- **Development mode bypass**: Log when NODE_ENV=development/test
- **Configuration errors**: Log invalid configuration values
