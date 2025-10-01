import '@testing-library/jest-dom'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key) => key),
  NextIntlClientProvider: ({ children }) => children,
}))

jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() => Promise.resolve((key) => key)),
}))

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
      signInWithPassword: jest.fn(() => Promise.resolve({ data: { user: null, session: null }, error: null })),
      signUp: jest.fn(() => Promise.resolve({ data: { user: null, session: null }, error: null })),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
    },
  })),
}))

// Mock Zustand auth store
jest.mock('@/lib/auth/store', () => ({
  useAuthStore: jest.fn(() => ({
    user: null,
    loading: false,
    initialized: true,
    signIn: jest.fn(() => Promise.resolve({ error: null })),
    signUp: jest.fn(() => Promise.resolve({ error: null })),
    signOut: jest.fn(() => Promise.resolve()),
    initialize: jest.fn(() => Promise.resolve()),
  })),
  useAuth: jest.fn(() => ({
    user: null,
    loading: false,
    initialized: true,
    signIn: jest.fn(() => Promise.resolve({ error: null })),
    signUp: jest.fn(() => Promise.resolve({ error: null })),
    signOut: jest.fn(() => Promise.resolve()),
    initialize: jest.fn(() => Promise.resolve()),
  })),
}))