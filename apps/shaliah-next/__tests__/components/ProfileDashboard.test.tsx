import { render, screen } from '@testing-library/react'
import { ProfileDashboard } from '@/components/ProfileDashboard'

describe('ProfileDashboard', () => {
  it('displays user full name', () => {
    render(<ProfileDashboard user={{
      id: 'user-123',
      fullName: 'John Doe',
      avatarUrl: null,
      language: 'en',
    }} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })
})