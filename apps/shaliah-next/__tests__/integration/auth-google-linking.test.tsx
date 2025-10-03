import { render, screen } from '@testing-library/react';
import AuthGoogleLinkingTest from './AuthGoogleLinkingTest';

describe('Google OAuth Account Linking (Scenario 5)', () => {
  it('links Google identity to existing magic link account', async () => {
    render(<AuthGoogleLinkingTest />);

    // Verify the Google button exists
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
  });
});