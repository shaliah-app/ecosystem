import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { jest } from '@jest/globals';
import AuthCooldownTest from './AuthCooldownTest';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithOtp: jest.fn(),
    },
  })),
}));

describe('Auth Cooldown Enforcement (Scenario 2)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('enforces cooldown timer countdown and resend cycle', async () => {
    render(<AuthCooldownTest />);

    // Step 1: Request first magic link
    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByText('Send Magic Link'));

    // Verify success message and cooldown starts
    await waitFor(() => {
      expect(screen.getByText('Check your email for a magic link')).toBeInTheDocument();
    });
    expect(screen.getByText(/Wait 60s/)).toBeInTheDocument();

    // Step 2: Attempt immediate resend - button should be disabled
    const resendButton = screen.getByText('Resend');
    expect(resendButton).toBeDisabled();

    // Step 3: Fast-forward time to test countdown
    act(() => {
      jest.advanceTimersByTime(30000); // 30 seconds
    });
    expect(screen.getByText(/Wait 30s/)).toBeInTheDocument();
    expect(resendButton).toBeDisabled();

    // Step 4: Wait for cooldown expiry
    act(() => {
      jest.advanceTimersByTime(30000); // Another 30 seconds
    });
    expect(screen.getByText(/Wait 0s/)).toBeInTheDocument();
    expect(resendButton).not.toBeDisabled();

    // Step 5: Send second magic link after cooldown
    fireEvent.click(resendButton);
    await waitFor(() => {
      expect(screen.getByText('Magic link sent successfully')).toBeInTheDocument();
    });
    expect(screen.getByText(/Wait 60s/)).toBeInTheDocument();
  });
});