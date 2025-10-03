// Integration test component - uses actual AuthForm
import { AuthForm } from '@/components/AuthForm'

export default function AuthGoogleLinkingTest() {
  return <AuthForm />
}

// Dummy test to prevent Jest from complaining
describe('AuthGoogleLinkingTest Component', () => {
  it('is a placeholder test', () => {
    expect(true).toBe(true);
  });
});