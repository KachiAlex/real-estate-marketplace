import { renderHook, act } from '@testing-library/react';
import { usePayments } from '../usePayments';

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user_001', name: 'Test User' } }),
}));

const mockLocalStorage = (() => {
  let store = { accessToken: 'test_jwt_token' };
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('usePayments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe('3.2.4.1 Handle payment initialization', () => {
    it('initializes payment successfully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            paymentId: 'pay_001',
            reference: 'txref_001',
            authorizationUrl: 'https://paystack.com/pay/txref_001',
          },
        }),
      });

      const { result } = renderHook(() => usePayments());

      let paymentData;
      await act(async () => {
        paymentData = await result.current.initializePayment(25000000, 'paystack', { propertyId: 'prop_001' });
      });

      expect(paymentData).toBeTruthy();
      expect(paymentData.paymentId).toBe('pay_001');
      expect(result.current.paymentStatus).toBe('initialized');
      expect(result.current.loading).toBe(false);
    });

    it('handles initialization failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Insufficient funds' }),
      });

      const { result } = renderHook(() => usePayments());

      let paymentData;
      await act(async () => {
        paymentData = await result.current.initializePayment(25000000);
      });

      expect(paymentData).toBeNull();
      expect(result.current.error).toBe('Insufficient funds');
      expect(result.current.loading).toBe(false);
    });

    it('sets loading state during initialization', async () => {
      let resolvePromise;
      global.fetch.mockImplementationOnce(() => new Promise((resolve) => { resolvePromise = resolve; }));

      const { result } = renderHook(() => usePayments());

      act(() => {
        result.current.initializePayment(25000000);
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise({ ok: true, json: async () => ({ data: {} }) });
      });
    });
  });

  describe('3.2.4.2 Manage payment verification', () => {
    it('verifies payment successfully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { status: 'success', transactionId: 'txn_001', amount: 25000000 },
        }),
      });

      const { result } = renderHook(() => usePayments());

      let verifyData;
      await act(async () => {
        verifyData = await result.current.verifyPayment('txref_001');
      });

      expect(verifyData).toBeTruthy();
      expect(verifyData.status).toBe('success');
      expect(result.current.paymentStatus).toBe('verified');
    });

    it('handles pending payment status', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { status: 'pending' } }),
      });

      const { result } = renderHook(() => usePayments());

      await act(async () => {
        await result.current.verifyPayment('txref_001');
      });

      expect(result.current.paymentStatus).toBe('pending');
    });

    it('handles verification failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid reference' }),
      });

      const { result } = renderHook(() => usePayments());

      let verifyData;
      await act(async () => {
        verifyData = await result.current.verifyPayment('invalid_ref');
      });

      expect(verifyData).toBeNull();
      expect(result.current.paymentStatus).toBe('failed');
    });

    it('returns null when no reference provided', async () => {
      const { result } = renderHook(() => usePayments());

      let verifyData;
      await act(async () => {
        verifyData = await result.current.verifyPayment(null);
      });

      expect(verifyData).toBeNull();
    });
  });

  describe('3.2.4.3 Handle payment errors', () => {
    it('sets error state on handlePaymentError', () => {
      const { result } = renderHook(() => usePayments());

      act(() => {
        result.current.handlePaymentError('Payment declined');
      });

      expect(result.current.error).toBe('Payment declined');
      expect(result.current.paymentStatus).toBe('failed');
    });

    it('resets payment state on resetPaymentState', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Error' }),
      });

      const { result } = renderHook(() => usePayments());

      await act(async () => {
        await result.current.initializePayment(1000);
      });

      act(() => {
        result.current.resetPaymentState();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.paymentStatus).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('handles network errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => usePayments());

      let paymentData;
      await act(async () => {
        paymentData = await result.current.initializePayment(25000000);
      });

      expect(paymentData).toBeNull();
      expect(result.current.error).toBe('Network error');
    });
  });
});
