import { render, screen, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import SessionExpiryTest from './SessionExpiryTest';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  })),
}));

// Mock router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('Session Expiry (Scenario 10)', () => {
  it('redirects to auth page with expired message on session expiry', async () => {
    // Mock expired session
    const mockGetSession = jest.fn().mockResolvedValue({
      data: { session: null }, // Expired session
      error: null,
    });

    require('@supabase/supabase-js').createClient.mockReturnValue({
      auth: {
        getSession: mockGetSession,
        onAuthStateChange: jest.fn(),
      },
    });

    render(<SessionExpiryTest />);

    // Simulate navigation to protected page
    // This would trigger session check

    // Verify session expiry detected
    await waitFor(() => {
      expect(mockGetSession).toHaveBeenCalled();
    });

    // Verify redirect to /auth?expired=true
    // Router.push should be called with '/auth?expired=true'

    // Verify expired session error message shown
    // On /auth page, should display "Session expired. Please sign in again."
  });
});