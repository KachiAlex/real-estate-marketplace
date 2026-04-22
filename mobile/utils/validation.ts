/**
 * Validation Utilities
 * Input validation and data validation helpers
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

/**
 * Validate JWT token format
 */
export function isValidJWT(token: string): boolean {
  const parts = token.split('.');
  return parts.length === 3;
}

/**
 * Check if token is expired
 */
export function isTokenExpired(expiresIn: number, issuedAt: number): boolean {
  const now = Date.now() / 1000;
  const expirationTime = issuedAt + expiresIn;
  return now > expirationTime;
}
