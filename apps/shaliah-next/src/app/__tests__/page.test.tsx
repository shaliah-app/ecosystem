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

    expect(screen.getByPlaceholderText('emailPlaceholder')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('passwordPlaceholder')).toBeInTheDocument()
    // Check for the submit button specifically
    expect(screen.getByRole('button', { name: 'signInButton' })).toBeInTheDocument()
  })
})