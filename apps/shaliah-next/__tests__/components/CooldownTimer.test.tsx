import { render, screen, fireEvent } from '@testing-library/react'
import { CooldownTimer } from '@/components/CooldownTimer'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key: string, options?: Record<string, unknown>) => {
    const translations: Record<string, string> = {
      cooldownTimer: 'Wait {seconds}s',
      resendMagicLink: 'Resend',
    }
    let translation = translations[key] || key
    if (options) {
      Object.keys(options).forEach((optKey) => {
        translation = translation.replace(`{${optKey}}`, String(options[optKey]))
      })
    }
    return translation
  }),
}))

describe('CooldownTimer', () => {
  const mockOnResend = jest.fn()

  beforeEach(() => {
    jest.useFakeTimers()
    localStorage.clear()
    mockOnResend.mockClear()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('shows button as enabled when no cooldown active', () => {
    render(<CooldownTimer secondsRemaining={0} onResend={mockOnResend} />)

    const button = screen.getByRole('button')
    expect(button).not.toBeDisabled()
  })

  it('shows button as disabled when cooldown active', () => {
    render(<CooldownTimer secondsRemaining={30} onResend={mockOnResend} />)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('shows countdown timer when cooldown active', () => {
    render(<CooldownTimer secondsRemaining={30} onResend={mockOnResend} />)

    // Should show countdown
    expect(screen.getByText('Wait 30s')).toBeInTheDocument()
  })

  it('calls onResend when button is clicked and enabled', () => {
    render(<CooldownTimer secondsRemaining={0} onResend={mockOnResend} />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(mockOnResend).toHaveBeenCalled()
  })

  it('respects disabled prop', () => {
    render(<CooldownTimer secondsRemaining={0} onResend={mockOnResend} disabled={true} />)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })
})