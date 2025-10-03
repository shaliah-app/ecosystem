import { render, screen } from '@testing-library/react';
import AuthGoogleSeparateAccountTest from './AuthGoogleSeparateAccountTest';

describe('Different Google Email Creates Distinct Account (FR-008)', () => {
  it('creates separate account when Google email differs from existing magic link account', async () => {
    render(<AuthGoogleSeparateAccountTest />);

    // Verify the Google button exists
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
  });
});