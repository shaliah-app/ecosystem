# Yesod API

A Hono-based API with Drizzle ORM and Supabase PostgreSQL.

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Fill in your Supabase credentials in `.env`

4. Generate database types (after defining schema):
   ```bash
   pnpm run db:generate
   ```

5. Push schema to database:
   ```bash
   pnpm run db:push
   ```

## Development

Start the development server:
```bash
pnpm run dev
```

The server will run on `http://localhost:3000`

## API Endpoints

- `GET /health` - Health check
- `GET /api/v1` - API info

## Project Structure

```
src/
├── config/
│   └── env.ts          # Environment configuration
├── db/
│   ├── index.ts        # Database connection
│   └── schema.ts       # Database schema
├── index.ts            # Hono app setup
└── server.ts           # Server entry point
```

## Technologies

- **Framework**: Hono
- **ORM**: Drizzle
- **Database**: Supabase PostgreSQL
- **Language**: TypeScript