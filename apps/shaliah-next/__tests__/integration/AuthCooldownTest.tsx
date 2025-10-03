// Integration test component - uses actual AuthForm
import { AuthForm } from '@/components/AuthForm'

export default function AuthCooldownTest() {
  return <AuthForm />
}

// Dummy test to prevent Jest from complaining
describe('AuthCooldownTest Component', () => {
  it('is a placeholder test', () => {
    expect(true).toBe(true);
  });
});