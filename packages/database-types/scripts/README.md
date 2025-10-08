# Type Generation Scripts

This directory contains scripts for automatically generating TypeScript types from Drizzle schemas.

## Available Scripts

### `generate-types.ts`
Basic type generation script that creates TypeScript interfaces from predefined schemas.

### `generate-from-drizzle.ts`
Advanced script that can generate types from Drizzle schema introspection (requires more setup).

## Usage

```bash
# Generate types using the basic script
pnpm generate-types

# Or run the advanced script
tsx scripts/generate-from-drizzle.ts
```

## Future Enhancements

The ideal setup would be to use Drizzle's introspection capabilities to automatically read the database schema and generate types. This would require:

1. Database connection configuration
2. Drizzle introspection setup
3. Automatic schema reading and type generation

For now, the manual approach with the generation scripts provides a good balance of automation and control.
