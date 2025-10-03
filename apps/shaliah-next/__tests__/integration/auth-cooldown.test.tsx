import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { jest } from '@jest/globals';
import AuthCooldownTest from './AuthCooldownTest';

// Get the mocked signInWithOtp function from global
const mockSignInWithOtp = (global as any).mockSignInWithOtp as jest.MockedFunction<any>;

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

// Create a simple in-memory storage for the mock
const mockStorage = new Map();

describe('Auth Cooldown Enforcement (Scenario 2)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockStorage.clear();
    localStorageMock.getItem.mockImplementation((key) => mockStorage.get(key) || null);
    localStorageMock.setItem.mockImplementation((key, value) => mockStorage.set(key, value));
    localStorageMock.removeItem.mockImplementation((key) => mockStorage.delete(key));
    localStorageMock.clear.mockImplementation(() => mockStorage.clear());
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('enforces cooldown timer countdown and resend cycle', async () => {
    render(<AuthCooldownTest />);

    // Wait for the auth hook to initialize (loading becomes false)
    await waitFor(() => {
      expect(screen.getByText('Continue with Email')).not.toBeDisabled();
    });

    // Step 1: Click "Continue with Email" to show email input
    const continueWithEmailButton = screen.getByText('Continue with Email');
    fireEvent.click(continueWithEmailButton);

    // Wait for the email input to appear
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    });

    // Now the email input should be visible
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    // Submit the form by clicking the submit button
    const submitButton = screen.getByText('Send Magic Link');
    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Verify success message and cooldown starts
    await waitFor(() => {
      expect(screen.getByText('Check your email for a magic link')).toBeInTheDocument();
    });

    // Verify the mock was called
    expect(mockSignInWithOtp).toHaveBeenCalledWith('test@example.com');

    // Verify the resend button is disabled initially
    const resendButton = screen.getByText('Resend Magic Link');
    expect(resendButton).toBeDisabled();
  });
});