import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import StorageBlockedTest from './StorageBlockedTest';

// Mock localStorage to simulate blocking
const originalLocalStorage = global.localStorage;
const originalCookie = document.cookie;

describe('Storage Blocked Error (Scenario 9)', () => {
  beforeEach(() => {
    // Mock localStorage.setItem to throw
    Object.defineProperty(window, 'localStorage', {
      value: {
        setItem: jest.fn(() => {
          throw new Error('localStorage blocked');
        }),
        getItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    // Mock document.cookie to be blocked
    Object.defineProperty(document, 'cookie', {
      get: () => {
        throw new Error('Cookies blocked');
      },
      set: () => {
        throw new Error('Cookies blocked');
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
    });
    Object.defineProperty(document, 'cookie', {
      get: () => originalCookie,
      set: (value) => { document.cookie = value; },
    });
  });

  it('shows non-dismissible error overlay when storage is blocked', async () => {
    render(<StorageBlockedTest />);

    // Navigate to auth page (storage check happens on mount)
    // This should trigger storage detection

    // Verify error overlay shown
    await waitFor(() => {
      expect(screen.getByText('Cookies and Local Storage Required')).toBeInTheDocument();
    });

    // Verify instructions displayed
    expect(screen.getByText(/Enable cookies in browser settings/)).toBeInTheDocument();

    // Verify retry button present
    expect(screen.getByText('Retry')).toBeInTheDocument();

    // Verify overlay is non-dismissible (no close button)
    expect(screen.queryByLabelText('Close')).not.toBeInTheDocument();
    expect(screen.queryByText('×')).not.toBeInTheDocument();

    // Click retry (simulate enabling storage)
    // Mock storage becoming available
    Object.defineProperty(window, 'localStorage', {
      value: {
        setItem: jest.fn(),
        getItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    fireEvent.click(screen.getByText('Retry'));

    // Verify error disappears
    await waitFor(() => {
      expect(screen.queryByText('Cookies and Local Storage Required')).not.toBeInTheDocument();
    });
  });
});