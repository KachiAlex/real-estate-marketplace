/**
 * AddProperty Component Tests
 * Tests focus on verifying integration of auto-save functionality
 */

// IMPORTANT: Mocks must be defined before any imports
jest.mock('../../hooks/useAutoSave', () => ({
  useAutoSave: jest.fn(() => ({
    clearSavedData: jest.fn(),
    loadSavedData: jest.fn(() => null),
  })),
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    },
    loading: false,
  }),
}));

jest.mock('../../contexts/PropertyContext', () => ({
  useProperty: () => ({
    createProperty: jest.fn(() => Promise.resolve({ success: true, id: 'prop-123' })),
    updateProperty: jest.fn(() => Promise.resolve({ success: true })),
    loading: false,
  }),
}));

jest.mock('../../contexts/VendorContext', () => ({
  useVendor: () => ({
    isAgent: false,
    isPropertyOwner: false,
    checkDocumentStatus: jest.fn(),
    uploadAgentDocument: jest.fn(),
  }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/add-property', search: '', state: null }),
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
}));

jest.mock('../../components/PropertyImageUpload', () => ({
  __esModule: true,
  default: () => <div data-testid="image-upload">Image Upload</div>,
}));

jest.mock('../../components/PropertyVideoUpload', () => ({
  __esModule: true,
  default: () => <div data-testid="video-upload">Video Upload</div>,
}));

jest.mock('../../components/PropertyDocumentUpload', () => ({
  __esModule: true,
  default: () => <div data-testid="document-upload">Document Upload</div>,
}));

jest.mock('../../components/GoogleMapsAutocomplete', () => ({
  __esModule: true,
  default: () => <div data-testid="google-maps-autocomplete">Google Maps</div>,
}));

jest.mock('../../components/AddressMemory', () => ({
  __esModule: true,
  default: () => <div data-testid="address-memory">Address Memory</div>,
}));

jest.mock('../../components/MemoryInput', () => ({
  __esModule: true,
  default: () => <div data-testid="memory-input">Memory Input</div>,
}));

jest.mock('../../components/InvestmentDetailsModal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../components/AgentPropertyListing', () => ({
  __esModule: true,
  default: () => <div data-testid="agent-property-listing">Agent Listing</div>,
}));

jest.mock('../../services/storageService', () => ({
  __esModule: true,
  default: {
    uploadFile: jest.fn(() => Promise.resolve('https://example.com/file.jpg')),
  },
}));

// Now import after mocks are defined
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AddProperty from '../AddProperty';
import { useAutoSave } from '../../hooks/useAutoSave';

// Mock browser APIs
window.scrollTo = jest.fn();

describe('AddProperty', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    // Reset the mock to return proper values
    useAutoSave.mockReturnValue({
      clearSavedData: jest.fn(),
      loadSavedData: jest.fn(() => null),
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should render add property form', async () => {
    render(
      <MemoryRouter initialEntries={['/add-property']}>
        <AddProperty />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('image-upload')).toBeInTheDocument();
    });
  });

  it('should use auto-save hook with correct parameters', () => {
    render(
      <MemoryRouter initialEntries={['/add-property']}>
        <AddProperty />
      </MemoryRouter>
    );

    expect(useAutoSave).toHaveBeenCalled();
    const callArgs = useAutoSave.mock.calls[0];
    expect(callArgs[0]).toContain('addPropertyForm_');
    expect(typeof callArgs[2]).toBe('number');
  });

  it('should call useAutoSave with user-specific storage key', () => {
    render(
      <MemoryRouter initialEntries={['/add-property']}>
        <AddProperty />
      </MemoryRouter>
    );

    expect(useAutoSave).toHaveBeenCalled();
    const storageKey = useAutoSave.mock.calls[0][0];
    expect(storageKey).toContain('addPropertyForm_user-123');
  });

  it('should import and use auto-save functionality', () => {
    expect(AddProperty).toBeDefined();
    expect(useAutoSave).toBeDefined();
  });

  it('should render form components', async () => {
    render(
      <MemoryRouter initialEntries={['/add-property']}>
        <AddProperty />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('image-upload')).toBeInTheDocument();
      expect(screen.getByTestId('video-upload')).toBeInTheDocument();
      expect(screen.getByTestId('document-upload')).toBeInTheDocument();
    });
  });

  it('should render Google Maps autocomplete', () => {
    render(
      <MemoryRouter initialEntries={['/add-property']}>
        <AddProperty />
      </MemoryRouter>
    );

    expect(screen.getByTestId('google-maps-autocomplete')).toBeInTheDocument();
  });

  it('should render address memory component', () => {
    render(
      <MemoryRouter initialEntries={['/add-property']}>
        <AddProperty />
      </MemoryRouter>
    );

    // AddressMemory is rendered multiple times in the form
    const addressMemoryComponents = screen.getAllByTestId('address-memory');
    expect(addressMemoryComponents.length).toBeGreaterThan(0);
    expect(addressMemoryComponents[0]).toBeInTheDocument();
  });
});
