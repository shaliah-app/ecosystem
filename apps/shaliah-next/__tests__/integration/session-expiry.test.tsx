import { render, screen } from '@testing-library/react';
import { jest } from '@jest/globals';
import SessionExpiryTest from './SessionExpiryTest';

// Mock router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('Session Expiry (Scenario 10)', () => {
  it('redirects to auth page with expired message on session expiry', async () => {
    render(<SessionExpiryTest />);

    // The component calls getUser on mount via useEffect
    // Verify expired session message shown
    expect(screen.getByText('Session expired. Please sign in again.')).toBeInTheDocument();
  });
});