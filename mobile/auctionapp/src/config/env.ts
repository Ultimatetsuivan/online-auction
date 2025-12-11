// Environment configuration
// Use EXPO_PUBLIC_ prefix for variables that should be available in the app

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    console.warn(`⚠️ Environment variable ${key} is not set. Using default: ${defaultValue || 'undefined'}`);
  }
  return value || '';
};

export const ENV = {
  // API Configuration - Using ngrok (works from anywhere!)
  API_BASE_URL: getEnvVar('EXPO_PUBLIC_API_BASE_URL', 'https://adrenally-cotemporaneous-kristi.ngrok-free.dev'),
  SOCKET_URL: getEnvVar('EXPO_PUBLIC_SOCKET_URL', 'https://adrenally-cotemporaneous-kristi.ngrok-free.dev'),
  
  // Feature Flags
  ENABLE_ANALYTICS: getEnvVar('EXPO_PUBLIC_ENABLE_ANALYTICS', 'false') === 'true',
  ENABLE_CRASH_REPORTING: getEnvVar('EXPO_PUBLIC_ENABLE_CRASH_REPORTING', 'false') === 'true',
  
  // App Configuration
  APP_VERSION: getEnvVar('EXPO_PUBLIC_APP_VERSION', '1.0.0'),
  ENVIRONMENT: getEnvVar('EXPO_PUBLIC_ENV', 'development'), // development, staging, production
} as const;

// Validate critical environment variables
if (!ENV.API_BASE_URL) {
  console.error('❌ EXPO_PUBLIC_API_BASE_URL is required but not set');
}

if (!ENV.SOCKET_URL) {
  console.error('❌ EXPO_PUBLIC_SOCKET_URL is required but not set');
}

export default ENV;

