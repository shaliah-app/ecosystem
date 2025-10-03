// Integration test component - uses actual ProfileDashboard
import { ProfileDashboard } from '@/components/ProfileDashboard'

interface TestUser {
  id: string
  fullName?: string | null
  avatarUrl?: string | null
  language?: string
  email?: string
}

interface ProfileLanguageChangeTestProps {
  user?: TestUser
}

export default function ProfileLanguageChangeTest({ user }: ProfileLanguageChangeTestProps = {}) {
  // Default test user
  const defaultUser: TestUser = {
    id: 'user-123',
    fullName: 'Paulo Santos',
    language: 'pt-BR',
    email: 'paulo@example.com',
    ...user,
  }

  return <ProfileDashboard user={defaultUser} />
}

// Dummy test to prevent Jest from complaining
describe('ProfileLanguageChangeTest Component', () => {
  it('is a placeholder test', () => {
    expect(true).toBe(true);
  });
});