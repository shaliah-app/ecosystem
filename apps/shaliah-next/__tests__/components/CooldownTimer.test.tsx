import { render, screen } from '@testing-library/react'
import { CooldownTimer } from '@/components/CooldownTimer'

describe('CooldownTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('displays countdown from 60 seconds', () => {
    render(<CooldownTimer secondsRemaining={60} />)

    expect(screen.getByText('60')).toBeInTheDocument()
  })

  it('displays countdown from 30 seconds', () => {
    render(<CooldownTimer secondsRemaining={30} />)

    expect(screen.getByText('30')).toBeInTheDocument()
  })

  it('displays countdown from 0 seconds', () => {
    render(<CooldownTimer secondsRemaining={0} />)

    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('formats time as MM:SS when over 60 seconds', () => {
    render(<CooldownTimer secondsRemaining={125} />)

    expect(screen.getByText('02:05')).toBeInTheDocument()
  })

  it('shows button as disabled when cooldown active', () => {
    render(<CooldownTimer secondsRemaining={30} />)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('shows button as enabled when cooldown finished', () => {
    render(<CooldownTimer secondsRemaining={0} />)

    const button = screen.getByRole('button')
    expect(button).not.toBeDisabled()
  })
})