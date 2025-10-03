import { render, screen } from '@testing-library/react'
import { OnboardingForm } from '@/components/OnboardingForm'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key: string) => {
    const translations: Record<string, string> = {
      fullName: 'Full Name',
      fullNamePlaceholder: 'Enter your full name',
      avatar: 'Avatar',
      avatarOptional: 'Optional',
      language: 'Language',
      english: 'English',
      portuguese: 'Portuguese',
      spanish: 'Spanish',
      french: 'French',
      german: 'German',
      ukrainian: 'Ukrainian',
      russian: 'Russian',
      submit: 'Continue',
      loading: 'Saving...',
      fullNameRequired: 'Full name is required',
      fullNameTooShort: 'Full name must be at least 2 characters',
      fullNameTooLong: 'Full name must be less than 100 characters',
    }
    return translations[key] || key
  }),
}))

describe('OnboardingForm', () => {
  it('renders full name input as required', () => {
    render(<OnboardingForm />)

    const fullNameInput = screen.getByLabelText(/full name/i)
    expect(fullNameInput).toBeRequired()
  })
})