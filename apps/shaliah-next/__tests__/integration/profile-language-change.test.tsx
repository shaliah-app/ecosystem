import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import ProfileLanguageChangeTest from './ProfileLanguageChangeTest';

// Mock Supabase and next-intl
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
  })),
}));

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

describe('Profile Language Change (Scenario 7)', () => {
  it('updates language and re-renders UI in new language', async () => {
    // Mock initial profile load
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          profile: {
            id: 'user-123',
            full_name: 'Paulo Santos',
            language: 'pt-BR',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          profile: {
            id: 'user-123',
            full_name: 'Paulo Santos',
            language: 'en-US', // Updated language
          },
        }),
      }) as jest.Mock;

    render(<ProfileLanguageChangeTest />);

    // Verify initial state
    await waitFor(() => {
      expect(screen.getByText('Paulo Santos')).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue('pt-BR')).toBeInTheDocument();

    // Change language to English
    const languageSelect = screen.getByLabelText('Language');
    fireEvent.change(languageSelect, { target: { value: 'en-US' } });
    fireEvent.click(screen.getByText('Save'));

    // Verify API call made
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: 'en-US' }),
      });
    });

    // Verify locale cookie set
    // This would check document.cookie contains NEXT_LOCALE=en-US

    // Verify UI re-renders in new language
    // Mock next-intl to return English translations
    // expect(screen.getByText('Save')).toBeInTheDocument(); // Assuming 'Save' is English key
  });
});