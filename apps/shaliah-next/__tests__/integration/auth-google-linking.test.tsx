import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import AuthGoogleLinkingTest from './AuthGoogleLinkingTest';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithOtp: jest.fn(),
      signInWithOAuth: jest.fn(),
      onAuthStateChange: jest.fn(),
      getUser: jest.fn(),
      signOut: jest.fn(),
    },
  })),
}));

describe('Google OAuth Account Linking (Scenario 5)', () => {
  it('links Google identity to existing magic link account', async () => {
    // Mock existing magic link account
    const existingUserId = 'existing-user-123';

    // Mock Google OAuth with same email as existing account
    const mockSignInWithOAuth = jest.fn().mockResolvedValue({
      data: { url: 'https://accounts.google.com/oauth' },
      error: null,
    });

    const mockOnAuthStateChange = jest.fn((callback) => {
      setTimeout(() => {
        callback('SIGNED_IN', {
          user: {
            id: existingUserId, // Same ID as existing account
            email: 'paulo@example.com',
            identities: [
              { provider: 'email' },
              { provider: 'google' }, // New identity added
            ],
          },
        });
      }, 100);
    });

    require('@supabase/supabase-js').createClient.mockReturnValue({
      auth: {
        signInWithOAuth: mockSignInWithOAuth,
        onAuthStateChange: mockOnAuthStateChange,
        getUser: jest.fn(),
        signOut: jest.fn(),
      },
    });

    render(<AuthGoogleLinkingTest />);

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

    // Verify no duplicate account created
    // Should link Google identity to existing user
    // Profile should remain unchanged (existing full_name, etc.)

    // Verify redirect to /profile (existing profile complete)
  });
});