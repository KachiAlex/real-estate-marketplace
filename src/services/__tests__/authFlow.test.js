import {
  handlePostAuth,
  handleRoleSelection,
  handleEmailPasswordAuth,
  getDefaultRedirectPath
} from '../authFlow';

// Mock react-hot-toast
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

describe('authFlow', () => {
  const mockNavigate = jest.fn();
  const mockSetLoggedInUser = jest.fn();
  const mockSetShowRoleSelection = jest.fn();
  const mockSetUser = jest.fn();
  const mockSwitchRole = jest.fn().mockResolvedValue({ success: true });

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    jest.useFakeTimers();
    // Spy on localStorage methods
    jest.spyOn(Storage.prototype, 'setItem');
    jest.spyOn(Storage.prototype, 'getItem');
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('handlePostAuth', () => {
    it('should return error if result is not successful', () => {
      const result = { success: false, message: 'Auth failed' };
      const output = handlePostAuth(result, mockNavigate, mockSetLoggedInUser, mockSetShowRoleSelection);
      
      expect(output.handled).toBe(false);
      expect(output.error).toBe('Auth failed');
    });

    it('should redirect admin to admin dashboard', () => {
      const result = {
        success: true,
        user: { id: '1', role: 'admin' }
      };
      const output = handlePostAuth(result, mockNavigate, mockSetLoggedInUser, mockSetShowRoleSelection);
      
      expect(output.handled).toBe(true);
      expect(output.redirect).toBe('/admin');
      expect(mockNavigate).toHaveBeenCalledWith('/admin', { replace: true });
    });

    it('should redirect mortgage bank to mortgage bank dashboard', () => {
      const result = {
        success: true,
        user: { id: '1', role: 'mortgage_bank' }
      };
      const output = handlePostAuth(result, mockNavigate, mockSetLoggedInUser, mockSetShowRoleSelection);
      
      expect(output.handled).toBe(true);
      expect(output.redirect).toBe('/mortgage-bank/dashboard');
      expect(mockNavigate).toHaveBeenCalledWith('/mortgage-bank/dashboard', { replace: true });
    });

    it('should show role selection for users with multiple roles', () => {
      const result = {
        success: true,
        user: { id: '1', roles: ['buyer', 'vendor'] }
      };
      const output = handlePostAuth(result, mockNavigate, mockSetLoggedInUser, mockSetShowRoleSelection);
      
      expect(output.handled).toBe(true);
      expect(output.showRoleSelection).toBe(true);
      expect(mockSetLoggedInUser).toHaveBeenCalledWith(result.user);
      expect(mockSetShowRoleSelection).toHaveBeenCalledWith(true);
    });

    it('should redirect to default dashboard for single role user', () => {
      const result = {
        success: true,
        user: { id: '1', role: 'buyer', roles: ['buyer'] }
      };
      const output = handlePostAuth(result, mockNavigate, mockSetLoggedInUser, mockSetShowRoleSelection);
      
      expect(output.handled).toBe(true);
      expect(output.redirect).toBe('/dashboard');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });

    it('should use redirectUrl if provided', () => {
      const result = {
        success: true,
        user: { id: '1', role: 'buyer' },
        redirectUrl: '/custom-path'
      };
      const output = handlePostAuth(result, mockNavigate, mockSetLoggedInUser, mockSetShowRoleSelection);
      
      expect(output.redirect).toBe('/custom-path');
      expect(mockNavigate).toHaveBeenCalledWith('/custom-path', { replace: true });
    });
  });

  describe('handleRoleSelection', () => {
    const mockLoggedInUser = {
      id: '1',
      email: 'test@example.com',
      roles: ['buyer', 'vendor']
    };

    it('should switch role and navigate to vendor dashboard', async () => {
      const result = await handleRoleSelection(
        'vendor',
        mockLoggedInUser,
        mockSetUser,
        mockSwitchRole,
        mockNavigate,
        mockSetShowRoleSelection
      );

      expect(result.success).toBe(true);
      expect(result.dashboardPath).toBe('/vendor/dashboard');
      expect(localStorage.setItem).toHaveBeenCalledWith('activeRole', 'vendor');
      expect(mockSetUser).toHaveBeenCalled();
      expect(mockSwitchRole).toHaveBeenCalledWith('vendor');
      expect(mockSetShowRoleSelection).toHaveBeenCalledWith(false);

      jest.advanceTimersByTime(100);
      expect(mockNavigate).toHaveBeenCalledWith('/vendor/dashboard', { replace: true });
    });

    it('should switch role and navigate to buyer dashboard', async () => {
      const result = await handleRoleSelection(
        'buyer',
        mockLoggedInUser,
        mockSetUser,
        mockSwitchRole,
        mockNavigate,
        mockSetShowRoleSelection
      );

      expect(result.success).toBe(true);
      expect(result.dashboardPath).toBe('/dashboard');
      
      jest.advanceTimersByTime(100);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });

    it('should handle errors gracefully', async () => {
      mockSwitchRole.mockRejectedValueOnce(new Error('Switch failed'));
      
      const result = await handleRoleSelection(
        'vendor',
        mockLoggedInUser,
        mockSetUser,
        mockSwitchRole,
        mockNavigate,
        mockSetShowRoleSelection
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Switch failed');
    });
  });

  describe('handleEmailPasswordAuth', () => {
    const mockLogin = jest.fn();

    it('should handle successful login', async () => {
      mockLogin.mockResolvedValue({
        success: true,
        user: { id: '1', role: 'buyer' }
      });

      const result = await handleEmailPasswordAuth(
        'test@example.com',
        'password123',
        mockLogin,
        mockNavigate,
        mockSetLoggedInUser,
        mockSetShowRoleSelection,
        null
      );

      expect(result.success).toBe(true);
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should handle validation failure', async () => {
      const mockValidateForm = jest.fn().mockReturnValue(false);

      const result = await handleEmailPasswordAuth(
        'test@example.com',
        'password123',
        mockLogin,
        mockNavigate,
        mockSetLoggedInUser,
        mockSetShowRoleSelection,
        mockValidateForm
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should handle login errors', async () => {
      mockLogin.mockRejectedValue(new Error('Login failed'));

      const result = await handleEmailPasswordAuth(
        'test@example.com',
        'password123',
        mockLogin,
        mockNavigate,
        mockSetLoggedInUser,
        mockSetShowRoleSelection,
        null
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Login failed');
    });
  });

  describe('getDefaultRedirectPath', () => {
    it('should return redirectUrl if provided', () => {
      const user = { id: '1', role: 'buyer' };
      const path = getDefaultRedirectPath(user, '/custom-path');
      expect(path).toBe('/custom-path');
    });

    it('should return admin path for admin user', () => {
      const user = { id: '1', role: 'admin' };
      const path = getDefaultRedirectPath(user);
      expect(path).toBe('/admin');
    });

    it('should return mortgage bank path for mortgage bank user', () => {
      const user = { id: '1', role: 'mortgage_bank' };
      const path = getDefaultRedirectPath(user);
      expect(path).toBe('/mortgage-bank/dashboard');
    });

    it('should return vendor dashboard for vendor active role', () => {
      const user = { id: '1', activeRole: 'vendor' };
      const path = getDefaultRedirectPath(user);
      expect(path).toBe('/vendor/dashboard');
    });

    it('should return buyer dashboard for buyer active role', () => {
      const user = { id: '1', activeRole: 'buyer' };
      const path = getDefaultRedirectPath(user);
      expect(path).toBe('/dashboard');
    });

    it('should return default dashboard if no user', () => {
      const path = getDefaultRedirectPath(null);
      expect(path).toBe('/dashboard');
    });
  });
});

