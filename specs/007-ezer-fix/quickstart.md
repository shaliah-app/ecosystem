# Quickstart: Ezer Bot Dependency Fix

**Feature**: 007-ezer-fix  
**Date**: 2025-01-27  
**Status**: Draft

## Overview

This quickstart guide demonstrates how to test the Ezer bot dependency fix feature. The feature ensures Ezer bot cannot operate without Shaliah being online, with a testing mode for development.

## Prerequisites

- Ezer bot running locally
- Shaliah application running locally
- Environment variables configured
- Test user access to Telegram bot

## Test Scenarios

### Scenario 1: Normal Operation (Shaliah Online)

**Objective**: Verify Ezer bot works normally when Shaliah is available

**Steps**:
1. Start Shaliah application
2. Verify Shaliah health endpoint: `curl http://localhost:3000/api/health`
3. Start Ezer bot with dependency check enabled
4. Send `/start` command to Ezer bot
5. Verify bot responds with welcome message
6. Send any other message to bot
7. Verify bot processes message normally

**Expected Result**: Bot operates normally, no dependency errors

### Scenario 2: Shaliah Offline

**Objective**: Verify Ezer bot shows error when Shaliah is unavailable

**Steps**:
1. Stop Shaliah application
2. Verify Shaliah is offline: `curl http://localhost:3000/api/health` (should fail)
3. Start Ezer bot with dependency check enabled
4. Send `/start` command to Ezer bot
5. Verify bot responds with offline error message
6. Send any other message to bot
7. Verify bot shows same offline error message

**Expected Result**: Bot shows friendly offline message, doesn't process commands

### Scenario 3: Development Mode

**Objective**: Verify development mode bypasses dependency check

**Steps**:
1. Stop Shaliah application (keep it offline)
2. Start Ezer bot with `NODE_ENV=development`
3. Send `/start` command to Ezer bot
4. Verify bot responds with welcome message (bypasses dependency check)
5. Send any other message to bot
6. Verify bot processes message normally

**Expected Result**: Bot works normally despite Shaliah being offline

### Scenario 4: Shaliah Becomes Unavailable During Session

**Objective**: Verify graceful handling when Shaliah goes offline during bot usage

**Steps**:
1. Start Shaliah application
2. Start Ezer bot with dependency check enabled
3. Send `/start` command to Ezer bot
4. Verify bot responds normally
5. Stop Shaliah application
6. Send another message to bot
7. Verify bot shows offline error message

**Expected Result**: Bot gracefully transitions to offline mode

## Configuration Testing

### Environment Variables

**Required**:
```bash
SHALIAH_HEALTH_URL=http://localhost:3000/api/health
```

**Optional**:
```bash
DEPENDENCY_CHECK_TIMEOUT=5000
NODE_ENV=production
```

### Testing Different Configurations

**Test 1: Custom Timeout**
```bash
DEPENDENCY_CHECK_TIMEOUT=1000  # 1 second timeout
```
- Start Shaliah with slow response
- Verify bot times out after 1 second

**Test 2: Invalid Health URL**
```bash
SHALIAH_HEALTH_URL=http://invalid-url:9999/api/health
```
- Verify bot treats invalid URL as offline

**Test 3: Development Mode Toggle**
```bash
NODE_ENV=development
```
- Verify bot bypasses all dependency checks

## Error Message Testing

### Expected Error Messages

**English (en.ftl)**:
```
shaliah-offline-message = 
    🔧 *Shaliah is currently offline*
    
    I need Shaliah to be running to help you. Please try again later.
    
    If you're a developer, make sure Shaliah is running locally.
```

**Portuguese (pt-BR.ftl)**:
```
shaliah-offline-message = 
    🔧 *Shaliah está offline no momento*
    
    Preciso que o Shaliah esteja funcionando para te ajudar. Tente novamente mais tarde.
    
    Se você é um desenvolvedor, certifique-se de que o Shaliah está rodando localmente.
```

### Message Testing

1. **Language Detection**: Verify bot uses user's preferred language
2. **Message Format**: Verify messages are user-friendly and non-technical
3. **Consistency**: Verify same message for all interactions when offline

## Performance Testing

### Response Time Requirements

- **Dependency check**: Must complete within 5 seconds
- **Error message**: Must appear within 6 seconds of user message
- **Testing mode**: Must bypass check instantly

### Load Testing

1. **Concurrent Users**: Multiple users sending messages simultaneously
2. **Rapid Messages**: User sending multiple messages quickly
3. **Mixed Scenarios**: Some users in testing mode, others not

## Troubleshooting

### Common Issues

**Issue**: Bot hangs on dependency check
- **Cause**: Shaliah health endpoint not responding
- **Solution**: Check Shaliah is running, verify health endpoint

**Issue**: Bot shows error even when Shaliah is online
- **Cause**: Wrong health URL or network issues
- **Solution**: Verify `SHALIAH_HEALTH_URL` is correct

**Issue**: Development mode not working
- **Cause**: Environment variable not set correctly
- **Solution**: Verify `NODE_ENV=development` or `NODE_ENV=test`

### Debug Information

**Logs to Check**:
- Dependency check attempts
- Health check response times
- Configuration loading
- Testing mode activation

**Commands to Run**:
```bash
# Check Shaliah health
curl -v http://localhost:3000/api/health

# Check Ezer bot logs
tail -f ezer-bot.log | grep dependency

# Verify environment variables
echo $SHALIAH_HEALTH_URL
echo $NODE_ENV
```

## Success Criteria

✅ **All scenarios pass**: Normal operation, offline handling, development mode  
✅ **Error messages**: User-friendly, translated, consistent  
✅ **Performance**: Dependency check completes within 5 seconds  
✅ **Configuration**: All environment variables work correctly  
✅ **Logging**: All events are logged appropriately  
✅ **Development mode**: Bypasses dependency check when NODE_ENV=development/test
