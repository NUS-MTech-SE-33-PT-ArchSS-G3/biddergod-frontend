/**
 * Environment Configuration
 *
 * This module provides type-safe access to environment variables.
 * Automatically detects local vs production environment and uses appropriate URLs.
 *
 * Usage:
 * - Local development: `npm run dev` uses .env.local with localhost URLs
 * - Production build: `npm run build` uses .env.production with deployed AWS URLs
 */

interface EnvironmentConfig {
  // Primary API Gateway URL (Kong) - All requests go through here
  apiGatewayUrl: string;

  // Environment info
  isDevelopment: boolean;
  isProduction: boolean;
}

/**
 * Get environment configuration based on current mode
 */
function getEnvironmentConfig(): EnvironmentConfig {
  const isDevelopment = import.meta.env.DEV;
  const isProduction = import.meta.env.PROD;

  // Kong API Gateway URL - ALL requests go through here
  // Local dev: http://localhost:8000
  // Production: http://<kong-public-ip>:8000
  const apiGatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8000';

  return {
    apiGatewayUrl,
    isDevelopment,
    isProduction,
  };
}

// Export singleton config instance
export const config = getEnvironmentConfig();

// Export convenience function
export const getApiUrl = (path: string = ''): string => {
  const baseUrl = config.apiGatewayUrl.replace(/\/$/, ''); // Remove trailing slash
  const cleanPath = path.replace(/^\//, ''); // Remove leading slash
  return cleanPath ? `${baseUrl}/${cleanPath}` : baseUrl;
};

// Export default for convenience
export default config;