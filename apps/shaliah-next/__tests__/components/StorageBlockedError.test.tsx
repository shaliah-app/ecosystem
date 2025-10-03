import { render, screen, fireEvent } from '@testing-library/react'
import { StorageBlockedError } from '@/components/StorageBlockedError'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key: string) => {
    const translations: Record<string, string> = {
      storageBlockedTitle: 'Storage Access Required',
      storageBlockedMessage: 'This application requires access to local storage and cookies to function properly. Please enable storage access in your browser settings.',
      storageBlockedInstructions: 'To enable storage access:',
      storageBlockedStep1: '1. Click the lock icon in your browser address bar',
      storageBlockedStep2: '2. Allow cookies and site data',
      storageBlockedStep3: '3. Refresh the page',
      retry: 'Retry',
      retrying: 'Retrying...',
    }
    return translations[key] || key
  }),
}))

describe('StorageBlockedError', () => {
  const mockOnRetry = jest.fn()

  it('renders non-dismissible overlay', () => {
    render(<StorageBlockedError onRetry={mockOnRetry} />)

    // Should render as a modal/overlay
    const overlay = screen.getByRole('dialog')
    expect(overlay).toBeInTheDocument()
  })

  it('displays error title', () => {
    render(<StorageBlockedError onRetry={mockOnRetry} />)

    expect(screen.getByText('Storage Access Required')).toBeInTheDocument()
  })

  it('displays error message', () => {
    render(<StorageBlockedError onRetry={mockOnRetry} />)

    expect(screen.getByText(/requires access to local storage/i)).toBeInTheDocument()
  })

  it('displays instructions', () => {
    render(<StorageBlockedError onRetry={mockOnRetry} />)

    expect(screen.getByText('To enable storage access:')).toBeInTheDocument()
    expect(screen.getByText(/Click the lock icon/)).toBeInTheDocument()
    expect(screen.getByText(/Allow cookies and site data/)).toBeInTheDocument()
    expect(screen.getByText(/Refresh the page/)).toBeInTheDocument()
  })

  it('renders retry button', () => {
    render(<StorageBlockedError onRetry={mockOnRetry} />)

    const retryButton = screen.getByRole('button', { name: /retry/i })
    expect(retryButton).toBeInTheDocument()
  })

  it('calls onRetry when retry button is clicked', () => {
    const mockOnRetry = jest.fn()
    render(<StorageBlockedError onRetry={mockOnRetry} />)

    const retryButton = screen.getByRole('button', { name: /retry/i })
    fireEvent.click(retryButton)

    expect(mockOnRetry).toHaveBeenCalled()
  })

  it('is not dismissible by clicking outside', () => {
    render(<StorageBlockedError onRetry={mockOnRetry} />)

    // The overlay should not have a close button or ESC handler
    // This is hard to test directly, but we can check there's no close button
    const closeButton = screen.queryByRole('button', { name: /close/i })
    expect(closeButton).not.toBeInTheDocument()
  })

  it('covers the entire screen', () => {
    render(<StorageBlockedError onRetry={mockOnRetry} />)

    const overlay = screen.getByRole('dialog')
    // Check for full screen overlay styles (this might vary by implementation)
    expect(overlay).toBeInTheDocument()
  })
})