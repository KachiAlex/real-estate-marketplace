/**
 * Authentication Types
 * Defines all TypeScript interfaces for authentication-related data structures
 */

export interface JWTToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  issuedAt: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data?: JWTToken;
  error?: {
    code: string;
    message: string;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: JWTToken | null;
  loading: boolean;
  error: string | null;
}

export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, any>;
}
