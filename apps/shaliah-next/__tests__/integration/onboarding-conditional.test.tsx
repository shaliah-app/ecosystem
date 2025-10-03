import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import OnboardingConditionalTest from './OnboardingConditionalTest';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      onAuthStateChange: jest.fn(),
      getUser: jest.fn(),
    },
  })),
}));

describe('Conditional Onboarding (Scenario 7)', () => {
  beforeEach(() => {
    // Mock fetch globally
    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
  });

  it('shows onboarding when full_name missing, skips when present', async () => {
    // Test case 1: full_name NULL -> show onboarding
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        profile: {
          id: 'user-123',
          full_name: null, // Missing full_name
          language: 'pt-BR',
        },
      }),
    } as Response);

    const { rerender } = render(<OnboardingConditionalTest key="test1" />);

    // Simulate auth success
    await waitFor(() => {
      expect(screen.getByText('Welcome! Let\'s set up your profile')).toBeInTheDocument();
    });

    // Verify onboarding form shown
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByText('Continue')).toBeInTheDocument();

    // Test case 2: full_name present -> skip onboarding
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        profile: {
          id: 'user-123',
          full_name: 'John Doe', // Present
          language: 'pt-BR',
        },
      }),
    } as Response);

    rerender(<OnboardingConditionalTest key="test2" />);

    // Verify onboarding skipped, redirect to profile
    await waitFor(() => {
      expect(screen.queryByText('Welcome! Let\'s set up your profile')).not.toBeInTheDocument();
    });
    // Router should have pushed to /profile
  });
});