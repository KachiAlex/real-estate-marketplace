/**
 * Production Build Configuration
 * 
 * Provides configuration and utilities for production builds.
 */

/**
 * Production build environment variables
 */
export interface ProductionBuildEnv {
  NODE_ENV: 'production';
  REACT_APP_API_URL: string;
  REACT_APP_MOBILE_API_URL?: string;
  GENERATE_SOURCEMAP: boolean;
  DISABLE_ESLINT_PLUGIN: boolean;
  CI: boolean;
}

/**
 * Get production build environment
 */
export function getProductionBuildEnv(): ProductionBuildEnv {
  return {
    NODE_ENV: 'production',
    REACT_APP_API_URL: process.env.REACT_APP_API_URL || 'https://api.propertyark.com',
    REACT_APP_MOBILE_API_URL