import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { QRCodeDisplay } from '@/modules/ezer-auth/ui/components/QRCodeDisplay'

// Mock next-qrcode
jest.mock('next-qrcode', () => ({
  useQRCode: jest.fn(),
}))

// Mock the useQRCode hook
const mockUseQRCode = jest.mocked(require('next-qrcode').useQRCode)

describe('QRCodeDisplay', () => {
  const mockDeepLink = 'https://t.me/ezer_bot?start=abc123def456'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders QR code SVG with correct deep link', async () => {
    // Mock successful QR code generation
    mockUseQRCode.mockReturnValue({
      svg: '<svg>QR Code Content</svg>',
      isLoading: false,
      error: null,
    })

    render(<QRCodeDisplay deepLink={mockDeepLink} />)

    // Wait for QR code to render
    await waitFor(() => {
      expect(screen.getByText('QR Code Content')).toBeInTheDocument()
    })

    // Verify useQRCode was called with correct deep link
    expect(mockUseQRCode).toHaveBeenCalledWith({
      text: mockDeepLink,
      options: expect.any(Object),
    })
  })

  it('displays loading state while generating', () => {
    // Mock loading state
    mockUseQRCode.mockReturnValue({
      svg: '',
      isLoading: true,
      error: null,
    })

    render(<QRCodeDisplay deepLink={mockDeepLink} />)

    // Should show loading indicator
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows error state on generation failure', () => {
    // Mock error state
    mockUseQRCode.mockReturnValue({
      svg: '',
      isLoading: false,
      error: new Error('QR code generation failed'),
    })

    render(<QRCodeDisplay deepLink={mockDeepLink} />)

    // Should show error message
    expect(screen.getByText(/failed to generate qr code/i)).toBeInTheDocument()
  })

  it('passes size prop to QR code options', () => {
    mockUseQRCode.mockReturnValue({
      svg: '<svg>Large QR Code</svg>',
      isLoading: false,
      error: null,
    })

    render(<QRCodeDisplay deepLink={mockDeepLink} size={300} />)

    expect(mockUseQRCode).toHaveBeenCalledWith({
      text: mockDeepLink,
      options: expect.objectContaining({
        width: 300,
        height: 300,
      }),
    })
  })

  it('applies custom className', () => {
    mockUseQRCode.mockReturnValue({
      svg: '<svg>Styled QR Code</svg>',
      isLoading: false,
      error: null,
    })

    const { container } = render(
      <QRCodeDisplay deepLink={mockDeepLink} className="custom-qr" />
    )

    // Check if custom class is applied to container
    const containerElement = container.firstChild
    expect(containerElement).toHaveClass('custom-qr')
  })
})