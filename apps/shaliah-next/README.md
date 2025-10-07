# Shaliah Next

A modern, full-stack Next.js application built with cutting-edge technologies for a seamless user experience.

## 🚀 Features

- **Next.js 15** with App Router for optimal performance and SEO
- **React 19** with concurrent features
- **TypeScript** for type safety
- **Tailwind CSS v4** for modern styling
- **Supabase** for authentication and PostgreSQL database
- **Zustand** for lightweight state management
- **Material Symbols** for beautiful, consistent icons
- **next-intl** for internationalization (i18n) support
- **shadcn/ui** for professional UI components
- **Jest** for comprehensive testing
- **Sentry** for error tracking and monitoring
- **ESLint** for code quality

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Material Symbols
- **State Management**: Zustand
- **Internationalization**: next-intl

### Backend & Infrastructure
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Error Monitoring**: Sentry
- **Deployment**: Vercel-ready

### Development & Testing
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint
- **Package Manager**: pnpm

## 📁 Project Structure

```
shaliah-next/
├── messages/                 # Internationalization files
│   └── en.json              # English translations
├── public/                  # Static assets
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page
│   ├── components/          # React components
│   │   ├── ui/              # Reusable UI components
│   │   └── AuthWrapper.tsx  # Authentication wrapper
│   ├── i18n/                # Internationalization config
│   │   └── request.ts       # Server-side i18n setup
│   └── lib/                 # Utility libraries
│       ├── auth/            # Authentication logic
│       ├── supabase/        # Database and client setup
│       └── utils.ts         # Helper functions
├── __tests__/               # Test files
├── jest.config.js           # Jest configuration
├── next.config.ts           # Next.js configuration
└── package.json             # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shaliah-next
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**

   Copy the environment files and fill in your values:

   ```bash
   cp .env.local.example .env.local
   cp .env.sentry-build-plugin.example .env.sentry-build-plugin
   ```

   Required environment variables:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Sentry (optional)
   SENTRY_DSN=your_sentry_dsn
   SENTRY_ORG=your_sentry_org
   SENTRY_PROJECT=your_sentry_project
   ```

4. **Database Setup**

   Run the database migrations in your Supabase project:
   ```bash
   # Apply migrations from drizzle/ directory
   supabase db push
   ```

5. **Start the development server**
   ```bash
   pnpm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📜 Available Scripts

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run start` - Start production server
- `pnpm run lint` - Run ESLint
- `pnpm test` - Run Jest tests
- `pnpm run test:local` - Run tests with local PostgreSQL database
- `pnpm run test:local:stop` - Stop local test database
- `pnpm run test:watch` - Run tests in watch mode
- `pnpm run db:test:migrate` - Apply database migrations to test database
- `pnpm run db:test:generate` - Generate new database migrations

## 🧪 Testing

The project uses Jest and React Testing Library for comprehensive testing:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage
pnpm test -- --coverage
```

### Local Testing Setup

For faster, more reliable testing, you can run tests against a local PostgreSQL database:

```bash
# Start local test database
pnpm run test:local

# Stop local test database
pnpm run test:local:stop
```

The local setup uses Docker to run PostgreSQL and automatically applies your database migrations.

### Test Structure

- **Unit Tests**: Component and utility function tests
- **Integration Tests**: Database and API integration tests
- **Contract Tests**: API contract validation
- **Mocking**: External dependencies are mocked where appropriate

## 🌐 Internationalization (i18n)

The app supports internationalization using next-intl:

- **Default Locale**: English (`en`)
- **Translation Files**: Located in `messages/` directory
- **Server Components**: Use `getTranslations()`
- **Client Components**: Use `useTranslations()`

### Adding New Languages

1. Create a new translation file: `messages/{locale}.json`
2. Update the i18n configuration if needed
3. Add locale routing for multi-language support

## 🎨 Styling & UI

### Design System

- **Colors**: Custom theme with light/dark mode support
- **Typography**: Rubik font family via Google Fonts
- **Icons**: Material Symbols with consistent styling
- **Components**: shadcn/ui for consistent, accessible components

### Material Symbols Icons

All icons are configured to be:
- Non-selectable (`user-select: none`)
- Translation-protected (`translate: no`)
- Accessible (`aria-hidden="true"`)

Usage:
```tsx
import { Icon } from '@/components/ui/icon'

// Basic usage
<Icon name="home" />

// With variants and sizing
<Icon name="favorite" variant="rounded" size={32} />
```

## 🔐 Authentication

Built with Supabase Auth:

- **Email/Password**: Standard authentication
- **Session Management**: Automatic token refresh
- **Protected Routes**: Client-side route protection
- **User Profiles**: Database-stored user information

## 📊 Database Schema

The application uses Supabase with the following main tables:

- `user_profiles`: Extended user information
- Authentication tables (managed by Supabase)

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Manual Deployment

```bash
# Build the application
pnpm run build

# Start production server
pnpm run start
```

### Code Quality

- Follow TypeScript best practices
- Write tests for new features
- Run `pnpm run lint` before committing
- Ensure all tests pass

## 🆘 Support

For support or questions:
- Check the [Next.js documentation](https://nextjs.org/docs)
- Review [Supabase docs](https://supabase.com/docs)
- Check [next-intl documentation](https://next-intl.dev/docs)

## 🔄 Recent Updates

- ✅ Next.js 15 with App Router
- ✅ React 19 support
- ✅ Material Symbols integration
- ✅ next-intl internationalization
- ✅ Comprehensive testing setup
- ✅ Modern UI with shadcn/ui
- ✅ Supabase authentication and database
- ✅ Sentry error monitoring
- ✅ TypeScript throughout</content>
<parameter name="filePath">/home/patrickkmatias/repos/yesod-ecosystem/apps/shaliah-next/README.md