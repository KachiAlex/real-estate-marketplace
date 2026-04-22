/**
 * Authentication Types
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

export interface AuthState {
  isAuthenticated: boolean;
  token: JWTToken | null;
  user: any | null;
  loading: boolean;
  error: string | null;
}
