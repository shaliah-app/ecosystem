import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import OnboardingConditionalTest from './OnboardingConditionalTest';

// Mock Supabase and router
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      onAuthStateChange: jest.fn(),
      getUser: jest.fn(),
    },
  })),
}));

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('Conditional Onboarding (Scenario 7)', () => {
  it('shows onboarding when full_name missing, skips when present', async () => {
    // Test case 1: full_name NULL -> show onboarding
    const mockGetUser = jest.fn().mockResolvedValue({
      data: {
        user: { id: 'user-123', email: 'test@example.com' },
      },
    });

    // Mock profile API response with full_name = null
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          profile: {
            id: 'user-123',
            full_name: null, // Missing full_name
            language: 'pt-BR',
          },
        }),
      })
    ) as jest.Mock;

    const { rerender } = render(<OnboardingConditionalTest />);

    // Simulate auth success
    await waitFor(() => {
      expect(screen.getByText('Welcome! Let\'s set up your profile')).toBeInTheDocument();
    });

    // Verify onboarding form shown
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByText('Continue')).toBeInTheDocument();

    // Test case 2: full_name present -> skip onboarding
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          profile: {
            id: 'user-123',
            full_name: 'John Doe', // Present
            language: 'pt-BR',
          },
        }),
      })
    ) as jest.Mock;

    rerender(<OnboardingConditionalTest />);

    // Verify onboarding skipped, redirect to profile
    await waitFor(() => {
      expect(screen.queryByText('Welcome! Let\'s set up your profile')).not.toBeInTheDocument();
    });
    // Router should have pushed to /profile
  });
});