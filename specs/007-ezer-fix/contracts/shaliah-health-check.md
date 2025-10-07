# Shaliah Health Check Contract

**Feature**: 007-ezer-fix  
**Date**: 2025-01-27  
**Status**: Draft

## Overview

This contract defines the health check endpoint that Ezer bot will use to verify Shaliah application availability.

## Endpoint Specification

### GET /api/health

**Purpose**: Check if Shaliah application is online and responsive

**Request**:
- **Method**: GET
- **URL**: `{SHALIAH_BASE_URL}/api/health`
- **Headers**: None required
- **Body**: None

**Response**:
- **Status Code**: 200 OK (if healthy)
- **Content-Type**: `application/json`
- **Body**: 
  ```json
  {
    "status": "healthy",
    "timestamp": "2025-01-27T10:30:00Z"
  }
  ```

**Error Responses**:
- **Status Code**: 500 Internal Server Error (if unhealthy)
- **Status Code**: 503 Service Unavailable (if maintenance mode)
- **Status Code**: 404 Not Found (if endpoint doesn't exist)
- **Status Code**: Timeout (if no response within 5 seconds)

## Implementation Requirements

### Shaliah Side (Existing)
- Must implement `/api/health` endpoint
- Must return 200 OK when application is healthy
- Must respond within 5 seconds
- Should return JSON with status information

### Ezer Bot Side (New)
- Must make HTTP GET request to health endpoint
- Must handle 5-second timeout
- Must treat any non-200 response as offline
- Must handle network errors gracefully

## Testing Scenarios

### Happy Path
1. Shaliah is running and healthy
2. Ezer bot makes GET request to `/api/health`
3. Shaliah responds with 200 OK
4. Ezer bot processes user message normally

### Offline Scenario
1. Shaliah is down or unreachable
2. Ezer bot makes GET request to `/api/health`
3. Request times out or returns error
4. Ezer bot shows offline error message

### Development Mode
1. Ezer bot has `NODE_ENV=development` or `NODE_ENV=test`
2. Ezer bot skips health check entirely
3. Ezer bot processes user message normally

## Error Handling

### Network Errors
- Connection refused → Treat as offline
- DNS resolution failure → Treat as offline
- SSL/TLS errors → Treat as offline

### Timeout Errors
- Request takes longer than 5 seconds → Treat as offline
- No response received → Treat as offline

### HTTP Errors
- 4xx client errors → Treat as offline
- 5xx server errors → Treat as offline
- Invalid JSON response → Treat as offline

## Configuration

### Environment Variables
- `SHALIAH_HEALTH_URL`: Full URL to health endpoint
- `DEPENDENCY_CHECK_TIMEOUT`: Timeout in milliseconds (default: 5000)
- `NODE_ENV`: Environment mode (development/test bypasses checks)

### Default Values
- Timeout: 5000ms (5 seconds)
- NODE_ENV: production (dependency check enabled)
- Health URL: Must be configured per environment

## Security Considerations

- Health endpoint should be publicly accessible
- No authentication required for health checks
- No sensitive information in health response
- Rate limiting not required (internal service)

## Monitoring

### Metrics to Track
- Health check success rate
- Health check response time
- Number of offline events
- Development mode usage

### Logging
- All health check attempts
- Success/failure with response time
- Configuration errors
- Development mode activations
