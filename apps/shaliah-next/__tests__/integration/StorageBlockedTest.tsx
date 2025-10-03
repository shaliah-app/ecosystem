// Integration test component - uses actual AuthForm which handles storage blocking
import { AuthForm } from '@/components/AuthForm'

export default function StorageBlockedTest() {
  return <AuthForm />
}

// Dummy test to prevent Jest from complaining
describe('StorageBlockedTest Component', () => {
  it('is a placeholder test', () => {
    expect(true).toBe(true);
  });
});