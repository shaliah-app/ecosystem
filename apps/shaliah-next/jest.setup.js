import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Polyfills for MSW
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Polyfill Web Streams for undici in Node test env
const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill/ponyfill')
if (!global.ReadableStream) global.ReadableStream = ReadableStream
if (!global.WritableStream) global.WritableStream = WritableStream
if (!global.TransformStream) global.TransformStream = TransformStream

// Polyfill MessagePort for undici (must be defined before requiring undici)
if (!global.MessagePort) {
  global.MessagePort = class MockMessagePort {
    postMessage() {}
    start() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() { return true }
  }
}

// Use undici to provide Web Fetch API (fetch/Request/Response/Headers)
const { fetch: undiciFetch, Request: UndiciRequest, Response: UndiciResponse, Headers: UndiciHeaders } = require('undici')
if (!global.fetch) global.fetch = undiciFetch
if (!global.Request) global.Request = UndiciRequest
if (!global.Response) global.Response = UndiciResponse
if (!global.Headers) global.Headers = UndiciHeaders

// Polyfills for Node.js setImmediate/clearImmediate (needed by postgres package)
global.setImmediate = global.setImmediate || ((fn, ...args) => setTimeout(fn, 0, ...args))
global.clearImmediate = global.clearImmediate || clearTimeout

// Mock next-intl
const translations = {
  auth: {
    continueWith: 'Continue with',
    continueWithEmail: 'Continue with Email',
    continueWithGoogle: 'Continue with Google',
    magicLinkSent: 'Check your email for a magic link',
    sendMagicLink: 'Send Magic Link',
    resendMagicLink: 'Resend Magic Link',
    cooldownTimer: 'Wait {seconds}s',
    cooldownMessage: 'Please wait before requesting another link.',
    linkExpired: 'This magic link has expired. Please request a new one.',
    linkInvalid: 'This magic link is invalid. Please request a new one.',
    linkUsed: 'This magic link has already been used. Please sign in again.',
    storageBlockedTitle: 'Cookies and Local Storage Required',
    storageBlockedMessage: 'This application requires cookies and local storage to function properly.',
    storageBlockedInstructions: 'To use this application, please enable cookies and local storage in your browser settings:',
    storageBlockedStep1: 'Open your browser settings',
    storageBlockedStep2: 'Enable cookies and local storage',
    storageBlockedStep3: 'Refresh this page',
    retry: 'Retry',
    retrying: 'Retrying...',
    email: 'email',
    back: 'back'
  },
  onboarding: {
    enterFullName: 'Enter your full name'
  },
  profile: {
    changeLanguage: 'Change Language'
  },
  HomePage: {
    title: 'Shaliah Next',
    welcome: 'Welcome to Shaliah Next with Supabase integration'
  },
  AuthForm: {
    signIn: 'Sign In',
    signUp: 'Create Account',
    email: 'Email',
    password: 'Password',
    emailPlaceholder: 'Enter your email',
    passwordPlaceholder: 'Enter your password',
    signInButton: 'Sign In',
    signUpButton: 'Sign Up',
    loading: 'Loading...',
    switchToSignUp: "Don't have an account? Sign up",
    switchToSignIn: 'Already have an account? Sign in',
    unexpectedError: 'An unexpected error occurred'
  },
  UserProfile: {
    welcome: 'Welcome',
    signOut: 'Sign Out',
    loading: 'Loading...'
  }
}

const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

jest.mock('next-intl', () => ({
  useTranslations: jest.fn((namespace) => {
    return (key, options) => {
      let translation = getNestedValue(translations[namespace], key) || key
      
      // Handle interpolation if options are provided
      if (options && typeof translation === 'string') {
        Object.entries(options).forEach(([placeholder, value]) => {
          translation = translation.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), String(value))
        })
      }
      
      return translation
    }
  }),
  NextIntlClientProvider: jest.fn(({ children, messages: providerMessages }) => {
    if (providerMessages) {
      // Override the global translations with provider messages for this test
      Object.assign(translations, providerMessages)
    }
    return children
  }),
}))

jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() => Promise.resolve((key) => getNestedValue(translations, key) || key)),
}))

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
      signInWithOtp: jest.fn(() => Promise.resolve({ data: { user: null, session: null }, error: null })),
      signInWithPassword: jest.fn(() => Promise.resolve({ data: { user: null, session: null }, error: null })),
      signUp: jest.fn(() => Promise.resolve({ data: { user: null, session: null }, error: null })),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        order: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
    })),
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
    getUser: jest.fn(() => Promise.resolve(null)),
    storageBlocked: false,
  })),
}))

// Mock useAuth hook
const mockSignInWithOtp = jest.fn(() => Promise.resolve({ error: null }));
const mockSignInWithOAuth = jest.fn(() => Promise.resolve({ error: null }));
const mockUseAuth = jest.fn(() => ({
  user: null,
  loading: false,
  signInWithOtp: mockSignInWithOtp,
  signInWithOAuth: mockSignInWithOAuth,
  signOut: jest.fn(() => Promise.resolve({ error: null })),
  getUser: jest.fn(() => Promise.resolve(null)),
  storageBlocked: false,
}));
jest.mock('@/hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}))

// Allow tests to override the mock
global.overrideUseAuthMock = (overrides) => {
  mockUseAuth.mockReturnValue({
    user: null,
    loading: false,
    signInWithOtp: mockSignInWithOtp,
    signInWithOAuth: mockSignInWithOAuth,
    signOut: jest.fn(() => Promise.resolve({ error: null })),
    getUser: jest.fn(() => Promise.resolve(null)),
    storageBlocked: false,
    ...overrides,
  });
}

// Export mocks for tests
global.mockSignInWithOtp = mockSignInWithOtp;
global.mockSignInWithOAuth = mockSignInWithOAuth;
global.mockUseAuth = mockUseAuth;;

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
}))

// Mock database for contract tests
const mockDb = {
  update: jest.fn(() => ({
    set: jest.fn(() => ({
      where: jest.fn(() => Promise.resolve()),
    })),
  })),
  insert: jest.fn(() => ({
    values: jest.fn(() => Promise.resolve()),
  })),
  select: jest.fn(() => ({
    from: jest.fn(() => ({
      where: jest.fn(() => Promise.resolve([])),
    })),
  })),
}

jest.mock('@/lib/db', () => ({
  db: mockDb,
}))

jest.mock('@/lib/database-injection', () => ({
  getDatabaseInstance: jest.fn(() => mockDb),
  setDatabaseInstance: jest.fn(),
  resetDatabaseInstance: jest.fn(),
  resetAllDatabaseInstances: jest.fn(),
}))

// Mock logger for contract tests
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn((msg, meta) => {
      console.error(`Logger error: ${msg}`, meta)
    }),
    debug: jest.fn(),
  },
}))

// Mock Supabase server client (needed for getAuthenticatedUserId)
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => ({
    auth: {
      getUser: jest.fn(async () => ({
        data: {
          user: { id: '550e8400-e29b-41d4-a716-446655440000' },
        },
        error: null,
      })),
    },
  })),
}))