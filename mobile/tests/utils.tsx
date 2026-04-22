import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';

/**
 * Custom render function that wraps components with necessary providers
 * Can be extended to include Redux, Context, or other providers
 */
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
  };

  return render(ui, { wrapper: Wrapper, ...options });
};

export * from '@testing-library/react-native';
export { customRender as render };

/**
 * Mock helper for AsyncStorage
 */
export const mockAsyncStorage = () => {
  const store: Record<string, string> = {};

  return {
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    }),
    getItem: jest.fn((key: string) => {
      return Promise.resolve(store[key] || null);
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
      return Promise.resolve();
    }),
    getAllKeys: jest.fn(() => {
      return Promise.resolve(Object.keys(store));
    }),
    multiSet: jest.fn((items: Array<[string, string]>) => {
      items.forEach(([key, value]) => {
        store[key] = value;
      });
      return Promise.resolve();
    }),
    multiGet: jest.fn((keys: string[]) => {
      return Promise.resolve(
        keys.map((key) => [key, store[key] || null])
      );
    }),
  };
};

/**
 * Mock helper for expo-secure-store
 */
export const mockSecureStore = () => {
  const store: Record<string, string> = {};

  return {
    setItemAsync: jest.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    }),
    getItemAsync: jest.fn((key: string) => {
      return Promise.resolve(store[key] || null);
    }),
    deleteItemAsync: jest.fn((key: string) => {
      delete store[key];
      return Promise.resolve();
    }),
  };
};

/**
 * Mock helper for API responses
 */
export const createMockAPIResponse = <T,>(data: T, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {},
});

/**
 * Wait for async operations to complete
 */
export const waitForAsync = () => {
  return new Promise((resolve) => setTimeout(resolve, 0));
};
