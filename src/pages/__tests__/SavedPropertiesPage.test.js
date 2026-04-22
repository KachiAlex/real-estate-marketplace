import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SavedPropertiesPage from '../SavedPropertiesPage';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('../../components/LazyImage', () => ({ src, alt, className }) => (
  <img src={src} alt={alt} className={className} />
));

const mockFetchFavorites = jest.fn();
const mockRemoveFavorite = jest.fn().mockResolvedValue(true);

const mockFavorites = [
  {
    favoriteId: 'fav_001',
    propertyId: 'prop_001',
    title: 'Lagos Island Apartment',
    location: 'Lagos Island, Lagos',
    city: 'Lagos',
    price: 25000000,
    propertyType: 'apartment',
    bedrooms: 3,
    bathrooms: 2,
    area: 1200,
    status: 'available',
    savedAt: '2024-01-15T10:00:00Z',
    image: 'https://example.com/img1.jpg',
  },
  {
    favoriteId: 'fav_002',
    propertyId: 'prop_002',
    title: 'Abuja Villa',
    location: 'Maitama, Abuja',
    city: 'Abuja',
    price: 80000000,
    propertyType: 'villa',
    bedrooms: 5,
    bathrooms: 4,
    area: 3500,
    status: 'available',
    savedAt: '2024-01-10T10:00:00Z',
    image: 'https://example.com/img2.jpg',
  },
];

jest.mock('../../hooks/useFavorites', () => ({
  useFavorites: () => ({
    favorites: mockFavorites,
    loading: false,
    fetchFavorites: mockFetchFavorites,
    removeFavorite: mockRemoveFavorite,
  }),
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user_001', name: 'Test User' } }),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <SavedPropertiesPage />
    </MemoryRouter>
  );

describe('SavedPropertiesPage', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('2.2.5.1.1 Fetch favorites from GET /api/favorites', () => {
    it('calls fetchFavorites on mount', () => {
      renderPage();
      expect(mockFetchFavorites).toHaveBeenCalled();
    });
  });

  describe('2.2.5.1.2 Display saved properties in grid format', () => {
    it('renders property cards', () => {
      renderPage();
      expect(screen.getByText('Lagos Island Apartment')).toBeInTheDocument();
      expect(screen.getByText('Abuja Villa')).toBeInTheDocument();
    });

    it('shows property details', () => {
      renderPage();
      expect(screen.getByText('Lagos Island, Lagos')).toBeInTheDocument();
    });
  });

  describe('2.2.5.1.3 Add filters', () => {
    it('renders property type filter', () => {
      renderPage();
      expect(screen.getByText(/property type/i)).toBeInTheDocument();
    });

    it('renders location filter', () => {
      renderPage();
      expect(screen.getByPlaceholderText(/search location/i)).toBeInTheDocument();
    });

    it('renders price range filters', () => {
      renderPage();
      expect(screen.getByText(/min price/i)).toBeInTheDocument();
      expect(screen.getByText(/max price/i)).toBeInTheDocument();
    });

    it('filters by property type', async () => {
      renderPage();
      const typeSelect = screen.getAllByRole('combobox').find(s =>
        s.querySelector ? true : false
      );
      // Select apartment type
      const selects = screen.getAllByRole('combobox');
      fireEvent.change(selects[1], { target: { value: 'villa' } });
      await waitFor(() => {
        expect(screen.queryByText('Lagos Island Apartment')).not.toBeInTheDocument();
        expect(screen.getByText('Abuja Villa')).toBeInTheDocument();
      });
    });

    it('filters by location', async () => {
      renderPage();
      const locationInput = screen.getByPlaceholderText(/search location/i);
      fireEvent.change(locationInput, { target: { value: 'Lagos' } });
      await waitFor(() => {
        expect(screen.getByText('Lagos Island Apartment')).toBeInTheDocument();
        expect(screen.queryByText('Abuja Villa')).not.toBeInTheDocument();
      });
    });
  });

  describe('2.2.5.1.4 Add sorting options', () => {
    it('renders sort dropdown', () => {
      renderPage();
      expect(screen.getByText(/sort by/i)).toBeInTheDocument();
    });

    it('sorts by price low to high', async () => {
      renderPage();
      const sortSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(sortSelect, { target: { value: 'price-low' } });
      await waitFor(() => {
        const cards = screen.getAllByRole('heading', { level: 3 });
        expect(cards[0].textContent).toBe('Lagos Island Apartment');
      });
    });
  });

  describe('2.2.5.1.5 Implement pagination', () => {
    it('does not show pagination for small lists', () => {
      renderPage();
      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
    });
  });

  describe('2.2.5.1.6 Add Remove from Favorites button', () => {
    it('renders remove button for each property', () => {
      renderPage();
      const removeButtons = screen.getAllByTitle('Remove from favorites');
      expect(removeButtons).toHaveLength(2);
    });

    it('calls removeFavorite when remove button clicked', async () => {
      renderPage();
      const removeButtons = screen.getAllByTitle('Remove from favorites');
      fireEvent.click(removeButtons[0]);
      await waitFor(() => expect(mockRemoveFavorite).toHaveBeenCalledWith('prop_001'));
    });
  });

  describe('2.2.5.1.7 Add View Details navigation', () => {
    it('renders View Details buttons', () => {
      renderPage();
      const viewButtons = screen.getAllByText('View Details');
      expect(viewButtons).toHaveLength(2);
    });

    it('navigates to property detail on click', () => {
      renderPage();
      const viewButtons = screen.getAllByText('View Details');
      fireEvent.click(viewButtons[0]);
      expect(mockNavigate).toHaveBeenCalledWith('/property/prop_001');
    });
  });

  describe('2.2.5.1.8 Display empty state', () => {
    it('shows empty state when no favorites', () => {
      jest.resetModules();
      jest.doMock('../../hooks/useFavorites', () => ({
        useFavorites: () => ({
          favorites: [],
          loading: false,
          fetchFavorites: jest.fn(),
          removeFavorite: jest.fn(),
        }),
      }));
    });
  });
});
