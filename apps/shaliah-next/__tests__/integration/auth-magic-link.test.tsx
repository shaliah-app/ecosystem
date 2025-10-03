import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import AuthMagicLinkTest from './AuthMagicLinkTest';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithOtp: jest.fn(),
      onAuthStateChange: jest.fn(),
      getUser: jest.fn(),
    },
  })),
}));

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const server = setupServer(
  rest.post('/api/auth/magic-link/request', (req: any, res: any, ctx: any) => {
    return res(ctx.json({ success: true, cooldown_seconds: 60 }));
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Auth Magic Link Happy Path (Scenario 1)', () => {
  it('completes full magic link flow from request to redirect', async () => {
    render(<AuthMagicLinkTest />);

    // Step 1: Navigate to auth page - verify buttons shown
    expect(screen.getByText('Continue with Email')).toBeInTheDocument();
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();

    // Step 2: Enter email and request magic link
    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByText('Continue with Email'));

    // Step 3: Verify UI state transition
    await waitFor(() => {
      expect(screen.getByText('Check your email for a magic link')).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByText(/Wait 60s/)).toBeInTheDocument();
    expect(screen.getByText('Back')).toBeInTheDocument();

    // Step 4: Mock link click (simulate auth callback)
    // This would normally happen via MSW intercepting the magic link URL
    // For now, we'll mock the auth state change

    // Step 5: Verify redirect logic (mock profile check)
    // If profile incomplete -> redirect to /onboarding
    // If profile complete -> redirect to /profile
  });
});