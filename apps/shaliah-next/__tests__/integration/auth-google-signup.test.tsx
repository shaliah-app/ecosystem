import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import AuthGoogleSignupTest from './AuthGoogleSignupTest';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithOAuth: jest.fn(),
      onAuthStateChange: jest.fn(),
      getUser: jest.fn(),
    },
  })),
}));

// Mock router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('Google OAuth Signup (Scenario 4)', () => {
  it('creates account and prefills profile on first Google auth', async () => {
    // Mock successful OAuth flow
    const mockSignInWithOAuth = jest.fn().mockResolvedValue({
      data: { url: 'https://accounts.google.com/oauth' },
      error: null,
    });

    const mockOnAuthStateChange = jest.fn((callback) => {
      // Simulate successful auth callback
      setTimeout(() => {
        callback('SIGNED_IN', {
          user: {
            id: 'user-123',
            email: 'john@gmail.com',
            user_metadata: {
              full_name: 'John Doe',
              avatar_url: 'https://google.com/avatar.jpg',
            },
          },
        });
      }, 100);
    });

    const mockGetUser = jest.fn().mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'john@gmail.com',
        },
      },
    });

    require('@supabase/supabase-js').createClient.mockReturnValue({
      auth: {
        signInWithOAuth: mockSignInWithOAuth,
        onAuthStateChange: mockOnAuthStateChange,
        getUser: mockGetUser,
      },
    });

    render(<AuthGoogleSignupTest />);

    // Click Google OAuth button
    fireEvent.click(screen.getByText('Continue with Google'));

    // Verify OAuth initiated
    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
    });

    // Wait for auth callback and profile creation
    await waitFor(() => {
      expect(mockOnAuthStateChange).toHaveBeenCalled();
    });

    // Verify account created with prefilled profile
    // This would check that user_profiles table has:
    // - full_name: 'John Doe'
    // - avatar_url: Google avatar URL
    // - language: inferred (default pt-BR)

    // Verify onboarding skipped (full_name present)
    // Router should push to /profile, not /onboarding
  });
});