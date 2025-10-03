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
  beforeEach(() => {
    // Mock fetch globally
    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
  });

  it('updates language and re-renders UI in new language', async () => {
    // Mock the profile update API call
    (global.fetch as jest.MockedFunction<typeof fetch>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'user-123',
          full_name: 'Paulo Santos',
          language: 'en-US',
          active_space_id: null,
          telegram_user_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      } as Response);

    render(<ProfileLanguageChangeTest />);

    // Verify initial state
    await waitFor(() => {
      expect(screen.getByText('Paulo Santos')).toBeInTheDocument();
    });
    // Check that Portuguese is selected in the language dropdown
    const selectButton = screen.getByRole('combobox');
    expect(selectButton).toHaveTextContent('Português');

    // Change language to English (this auto-submits)
    const languageSelect = screen.getByRole('combobox');
    fireEvent.click(languageSelect);
    // Select English option from the dropdown
    const englishOption = screen.getAllByText('English')[1]; // The dropdown option
    fireEvent.click(englishOption);

    // Verify API call made
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: 'en-US' }),
      });
    });

    // Verify the profile was updated (language should now be English)
    await waitFor(() => {
      const selectButtonAfter = screen.getByRole('combobox');
      expect(selectButtonAfter).toHaveTextContent('English');
    });
  });
});