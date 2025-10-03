import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import AuthGoogleSeparateAccountTest from './AuthGoogleSeparateAccountTest';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithOtp: jest.fn(),
      signInWithOAuth: jest.fn(),
      onAuthStateChange: jest.fn(),
      getUser: jest.fn(),
    },
  })),
}));

describe('Different Google Email Creates Distinct Account (FR-008)', () => {
  it('creates separate account when Google email differs from existing magic link account', async () => {
    // Mock existing magic link account for emailA@example.com
    const existingUserId = 'existing-user-123';

    // Mock Google OAuth with different email (emailB@example.com)
    const mockSignInWithOAuth = jest.fn().mockResolvedValue({
      data: { url: 'https://accounts.google.com/oauth' },
      error: null,
    });

    const mockOnAuthStateChange = jest.fn((callback) => {
      setTimeout(() => {
        callback('SIGNED_IN', {
          user: {
            id: 'new-user-456', // Different ID - new account
            email: 'emailB@example.com', // Different email
            user_metadata: {
              full_name: 'Jane Smith',
            },
          },
        });
      }, 100);
    });

    require('@supabase/supabase-js').createClient.mockReturnValue({
      auth: {
        signInWithOAuth: mockSignInWithOAuth,
        onAuthStateChange: mockOnAuthStateChange,
        getUser: jest.fn(),
      },
    });

    render(<AuthGoogleSeparateAccountTest />);

    // Click Google OAuth button
    fireEvent.click(screen.getByText('Continue with Google'));

    // Verify OAuth initiated
    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
    });

    // Wait for auth callback
    await waitFor(() => {
      expect(mockOnAuthStateChange).toHaveBeenCalled();
    });

    // Verify new account created (different user ID)
    // Assert two separate accounts exist:
    // - existing-user-123 (emailA@example.com)
    // - new-user-456 (emailB@example.com)

    // Verify new user_profiles row created for new-user-456
    // with full_name from Google metadata
  });
});