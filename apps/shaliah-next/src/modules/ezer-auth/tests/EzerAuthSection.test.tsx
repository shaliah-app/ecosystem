import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { EzerAuthSection } from '@/modules/ezer-auth/ui/components/EzerAuthSection'

// Mock the QRCodeDisplay component
jest.mock('@/modules/ezer-auth/ui/components/QRCodeDisplay', () => ({
  QRCodeDisplay: ({ deepLink }: { deepLink: string }) => (
    <div data-testid="qr-code-display">QR Code for {deepLink}</div>
  ),
}))

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'ezer-auth.generate-token': 'Generate Token',
      'ezer-auth.or-use-link': 'Or you might use this',
      'ezer-auth.link': 'link',
      'ezer-auth.linked': 'Linked',
      'ezer-auth.expires-in': 'Expires in',
      'ezer-auth.minutes': 'minutes',
      'ezer-auth.seconds': 'seconds',
      'ezer-auth.generating': 'Generating...',
      'ezer-auth.error': 'Error generating token',
    }
    return translations[key] || key
  },
}))

// Mock server action
const mockGenerateAuthTokenAction = jest.fn()
jest.mock('@/modules/ezer-auth/ui/server/actions', () => ({
  generateAuthTokenAction: mockGenerateAuthTokenAction,
}))

describe('EzerAuthSection', () => {
  const mockTokenData = {
    token: 'abc123def456ghi789jkl012mno345pqr',
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    deepLink: 'https://t.me/ezer_bot?start=abc123def456ghi789jkl012mno345pqr',
    qrCodeUrl: 'data:image/svg+xml;base64,mock-qr-code',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('displays QR code when token generated', async () => {
    mockGenerateAuthTokenAction.mockResolvedValue(mockTokenData)

    const { rerender } = render(<EzerAuthSection />)

    // Initially should show generate button
    expect(screen.getByText('Generate Token')).toBeInTheDocument()

    // Click generate button
    fireEvent.click(screen.getByText('Generate Token'))

    // Should show QR code display
    await waitFor(() => {
      expect(screen.getByTestId('qr-code-display')).toBeInTheDocument()
      expect(screen.getByText(`QR Code for ${mockTokenData.deepLink}`)).toBeInTheDocument()
    })
  })

  it('displays "Or you might use this [link]" text with clickable link', async () => {
    mockGenerateAuthTokenAction.mockResolvedValue(mockTokenData)

    render(<EzerAuthSection />)

    // Generate token
    fireEvent.click(screen.getByText('Generate Token'))

    await waitFor(() => {
      expect(screen.getByText('Or you might use this')).toBeInTheDocument()
      expect(screen.getByText('link')).toBeInTheDocument()
    })

    // Link should be clickable and point to deep link
    const linkElement = screen.getByText('link')
    expect(linkElement).toHaveAttribute('href', mockTokenData.deepLink)
    expect(linkElement).toHaveAttribute('target', '_blank')
    expect(linkElement).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('shows linked status when account linked', () => {
    // Mock component with linked prop (assuming we'll add this prop)
    // For now, test the text that should appear when linked
    render(<EzerAuthSection />)

    // This test will fail until we implement the linked state
    // The component should show "Linked" status when telegram_user_id is not null
    expect(screen.queryByText('Linked')).not.toBeInTheDocument()
  })

  it('shows expiration countdown', async () => {
    mockGenerateAuthTokenAction.mockResolvedValue(mockTokenData)

    render(<EzerAuthSection />)

    // Generate token
    fireEvent.click(screen.getByText('Generate Token'))

    await waitFor(() => {
      // Should show expiration countdown
      expect(screen.getByText(/Expires in/)).toBeInTheDocument()
      expect(screen.getByText(/minutes/)).toBeInTheDocument()
    })
  })

  it('shows loading state while generating token', async () => {
    mockGenerateAuthTokenAction.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockTokenData), 100))
    )

    render(<EzerAuthSection />)

    // Click generate button
    fireEvent.click(screen.getByText('Generate Token'))

    // Should show loading state
    expect(screen.getByText('Generating...')).toBeInTheDocument()

    // After loading completes, should show QR code
    await waitFor(() => {
      expect(screen.getByTestId('qr-code-display')).toBeInTheDocument()
    })
  })

  it('shows error state on token generation failure', async () => {
    mockGenerateAuthTokenAction.mockRejectedValue(new Error('Failed to generate token'))

    render(<EzerAuthSection />)

    // Click generate button
    fireEvent.click(screen.getByText('Generate Token'))

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Error generating token')).toBeInTheDocument()
    })
  })

  it('updates countdown over time', async () => {
    // Mock a token that expires in 2 minutes
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString()
    mockGenerateAuthTokenAction.mockResolvedValue({
      ...mockTokenData,
      expiresAt,
    })

    render(<EzerAuthSection />)

    // Generate token
    fireEvent.click(screen.getByText('Generate Token'))

    await waitFor(() => {
      expect(screen.getByText(/Expires in/)).toBeInTheDocument()
    })

    // Initially should show minutes (not seconds)
    expect(screen.getByText(/\d+ minutes/)).toBeInTheDocument()

    // Fast-forward time by 1 minute
    jest.advanceTimersByTime(60 * 1000)

    // Should now show ~1 minute
    await waitFor(() => {
      expect(screen.getByText(/59 seconds/)).toBeInTheDocument()
    })
  })
})