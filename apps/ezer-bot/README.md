# 🤖 Ezer Bot

A Telegram bot for the Kinnor ecosystem, built with grammY framework. Ezer provides users with a convenient interface for song search, audio matching, and playlist management.

## 🚀 Features

- **Song Search & Discovery** - Find songs in the Kinnor database
- **Audio Matching** - Identify songs from audio files
- **Playlist Management** - Create and manage personal playlists
- **Persistent Sessions** - Remember user context between interactions
- **High Performance** - Built with grammY's runner for concurrent processing
- **Production Ready** - Comprehensive error handling and logging

## 🛠️ Technology Stack

- **Framework**: [grammY](https://grammy.dev/) - Modern Telegram bot framework
- **Session Storage**: Supabase with `@grammyjs/storage-supabase`
- **Performance**: `@grammyjs/runner` for concurrent update processing
- **State Management**: `@grammyjs/session` with sequential processing
- **UI Components**: `@grammyjs/menu` for interactive menus
- **Language**: TypeScript with strict type checking

## 📋 Prerequisites

- Node.js 18+
- pnpm package manager
- Telegram Bot Token (from [@BotFather](https://t.me/botfather))
- Supabase project with database

## ⚙️ Setup

### 1. Install Dependencies

```bash
cd apps/ezer-bot
pnpm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Fill in your configuration:

```env
BOT_TOKEN=your-telegram-bot-token-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NODE_ENV=development
```

### 3. Supabase Setup

Create a `bot_sessions` table in your Supabase database:

```sql
CREATE TABLE bot_sessions (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional: Add RLS policies for security
ALTER TABLE bot_sessions ENABLE ROW LEVEL SECURITY;
```

### 4. Build the Project

```bash
pnpm run build
```

## 🏃‍♂️ Running the Bot

### Development Mode

```bash
pnpm run dev
```

### Production Mode

```bash
pnpm run start
```

## 📁 Project Structure

```
src/
├── bot.ts              # Main entry point and bot configuration
├── modules/            # Feature-specific composers
│   └── welcome.ts      # Welcome module with /start command
└── types/              # TypeScript type definitions
    └── context.ts      # Custom context with session and menu flavors
```

## 🏗️ Architecture

### Modular Composer Pattern

The bot uses a modular architecture where each feature is encapsulated in its own composer:

```typescript
// src/modules/welcome.ts
const composer = new Composer<Context>()

composer.command('start', async (ctx) => {
  // Handle /start command
})

export default composer
```

### Session Management

Persistent sessions are stored in Supabase:

```typescript
bot.use(
  session({
    initial: (): SessionData => ({
      // Initial session state
    }),
    storage: supabaseStorage({
      table: 'bot_sessions',
      supabase
    })
  })
)
```

### Error Handling

Global error handler catches all unhandled errors:

```typescript
bot.catch((err) => {
  console.error('Bot error:', err)
})
```

## 🔧 Available Commands

- `/start` - Welcome message and main menu
- `/help` - Show available commands

## 🚀 Deployment

### Environment Variables

Ensure all environment variables are set in your deployment environment:

- `BOT_TOKEN` - Your Telegram bot token
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `NODE_ENV` - Set to `production` for production deployment

### Process Management

For production, consider using PM2 or similar process manager:

```bash
npm install -g pm2
pm2 start dist/bot.js --name ezer-bot
```

## 🤝 Contributing

1. Follow the modular composer pattern for new features
2. Add proper TypeScript types
3. Include error handling
4. Test with both development and production builds
5. Update documentation as needed

## 📝 License

This project is part of the Kinnor ecosystem.