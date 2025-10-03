import { render, screen } from '@testing-library/react'
import { HomeContent } from '../../components/HomeContent'

describe('Home', () => {
  it('renders the main heading', () => {
    render(<HomeContent title="title" welcome="welcome" />)

    const heading = screen.getByRole('heading', { name: /title/i })
    expect(heading).toBeInTheDocument()
  })

  it('renders the welcome message', () => {
    render(<HomeContent title="title" welcome="welcome" />)

    expect(screen.getByText('welcome')).toBeInTheDocument()
  })

  it('renders the auth form when not authenticated', () => {
    render(<HomeContent title="title" welcome="welcome" />)

    // Check for the auth buttons that are shown initially
    expect(screen.getByText('Continue with Email')).toBeInTheDocument()
    expect(screen.getByText('Continue with Google')).toBeInTheDocument()
  })
})