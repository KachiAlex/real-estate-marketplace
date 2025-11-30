import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { PropertyProvider, useProperty } from '../PropertyContext';

// Mock Firebase
jest.mock('../../config/firebase', () => ({
  db: {},
  auth: {
    currentUser: { uid: 'test-user-123' }
  }
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  deleteDoc: jest.fn(),
  updateDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
}));

jest.mock('react-hot-toast', () => {
  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockToast,
  };
});

jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

jest.mock('../AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-123', email: 'test@example.com' }
  })
}));

// Test component that uses PropertyContext
const TestComponent = () => {
  const { properties, loading, toggleFavorite } = useProperty();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading' : 'Loaded'}</div>
      <div data-testid="properties-count">{properties?.length || 0}</div>
      <button onClick={() => toggleFavorite('prop-1')} data-testid="toggle-favorite">
        Toggle Favorite
      </button>
    </div>
  );
};

describe('PropertyContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should provide property context', () => {
    render(
      <PropertyProvider>
        <TestComponent />
      </PropertyProvider>
    );

    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('should provide properties list', async () => {
    render(
      <PropertyProvider>
        <TestComponent />
      </PropertyProvider>
    );

    await waitFor(() => {
      const count = screen.getByTestId('properties-count');
      expect(count).toBeInTheDocument();
    });
  });

  it('should provide toggleFavorite function', () => {
    render(
      <PropertyProvider>
        <TestComponent />
      </PropertyProvider>
    );

    const toggleButton = screen.getByTestId('toggle-favorite');
    expect(toggleButton).toBeInTheDocument();
    fireEvent.click(toggleButton);
  });
});

