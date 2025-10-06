# Archived Architecture Documentation

This directory contains architecture documentation for applications that have been deprecated or migrated to other solutions.

## yesod-api.md

**Status**: Archived  
**Date**: 2025-10-06  
**Reason**: The yesod-api backend application has been removed from the ecosystem. All backend functionality has been consolidated into the `shaliah-next` Next.js application using server actions, server components, and use-cases.

**Migration Path**: 
- Backend logic previously handled by yesod-api endpoints is now implemented via Next.js server actions in `apps/shaliah-next/src/modules/*/ui/server/actions.ts`
- Complex business logic orchestration uses the DDD-inspired layering: `domain/` → `ports/` → `adapters/` → `use-cases/` → server actions
- Direct Supabase integration via server-side clients for database operations
- See `docs/architecture/shaliah-next.md` for current patterns and best practices

**Historical Context**: This document is preserved for reference purposes to understand the evolution of the project architecture and to aid in understanding any remaining migration tasks or legacy code references.
