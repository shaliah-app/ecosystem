import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthForm } from '@/components/AuthForm'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key: string, params?: any) => {
    const translations: Record<string, string> = {
      continueWith: 'Continue with',
      continueWithEmail: 'Continue with Email',
      continueWithGoogle: 'Continue with Google',
      email: 'Email',
      emailPlaceholder: 'Enter your email',
      sendMagicLink: 'Send Magic Link',
      loading: 'Loading...',
      back: 'Back',
      magicLinkSent: 'Magic link sent to {email}',
      cooldownMessage: 'Resend available in {seconds} seconds',
      resendMagicLink: 'Resend Magic Link',
      cooldownActive: 'Please wait before requesting another link',
      unexpectedError: 'An unexpected error occurred',
    }
    let result = translations[key] || key
    if (params) {
      Object.keys(params).forEach(param => {
        result = result.replace(`{${param}}`, params[param])
      })
    }
    return result
  }),
}))

// Mock the auth store
const mockSignInWithMagicLink = jest.fn()
const mockSignInWithGoogle = jest.fn()

jest.mock('@/lib/auth/store', () => ({
  useAuth: () => ({
    signInWithMagicLink: mockSignInWithMagicLink,
    signInWithGoogle: mockSignInWithGoogle,
  }),
}))

describe('AuthForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    })
  })

  it('renders Continue with Email and Continue with Google buttons', () => {
    render(<AuthForm />)

    expect(screen.getByRole('button', { name: 'Continue with Email' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeInTheDocument()
  })

  it('shows email input when Continue with Email is clicked', () => {
    render(<AuthForm />)

    const emailButton = screen.getByRole('button', { name: 'Continue with Email' })
    fireEvent.click(emailButton)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send Magic Link' })).toBeInTheDocument()
  })

  it('validates email input and sends magic link', async () => {
    mockSignInWithMagicLink.mockResolvedValue({ error: null })

    render(<AuthForm />)

    // Click email button
    const emailButton = screen.getByRole('button', { name: 'Continue with Email' })
    fireEvent.click(emailButton)

    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: 'Send Magic Link' })

    // Enter valid email
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSignInWithMagicLink).toHaveBeenCalledWith('test@example.com')
    })
  })

  it('shows confirmation state after sending magic link', async () => {
    mockSignInWithMagicLink.mockResolvedValue({ error: null })

    render(<AuthForm />)

    // Click email button and submit valid email
    const emailButton = screen.getByRole('button', { name: 'Continue with Email' })
    fireEvent.click(emailButton)

    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: 'Send Magic Link' })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Magic link sent to test@example.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument()
    })
  })

  it('handles Google OAuth click', async () => {
    mockSignInWithGoogle.mockResolvedValue({ error: null, url: null })

    render(<AuthForm />)

    const googleButton = screen.getByRole('button', { name: 'Continue with Google' })
    fireEvent.click(googleButton)

    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalled()
    })
  })

  it('shows cooldown timer after sending magic link', async () => {
    mockSignInWithMagicLink.mockResolvedValue({ error: null })

    render(<AuthForm />)

    // Click email button and submit
    const emailButton = screen.getByRole('button', { name: 'Continue with Email' })
    fireEvent.click(emailButton)

    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: 'Send Magic Link' })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Resend available in \d+ seconds/)).toBeInTheDocument()
    })
  })
})