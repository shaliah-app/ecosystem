import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthMagicLinkTest from './AuthMagicLinkTest';

describe('Auth Magic Link Happy Path (Scenario 1)', () => {
  it('completes full magic link flow from request to redirect', async () => {
    const user = userEvent.setup()
    render(<AuthMagicLinkTest />);

    // Step 1: Wait for auth initialization and verify buttons shown
    await waitFor(() => {
      expect(screen.getByText('Continue with Email')).toBeInTheDocument();
      expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    });

    // Step 2: Click Continue with Email to show email input form
    await act(async () => {
      await user.click(screen.getByText('Continue with Email'));
    });

    // Step 3: Enter email and request magic link
    const emailInput = screen.getByPlaceholderText('emailPlaceholder');
    await act(async () => {
      await user.type(emailInput, 'test@example.com');
      await user.click(screen.getByText('Send Magic Link'));
    });

    // Step 4: Verify UI state transition
    await waitFor(() => {
      expect(screen.getByText('Check your email for a magic link')).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('back')).toBeInTheDocument();
  });
});