// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const apiConfig = {
  baseURL: API_BASE_URL,
  socketURL: SOCKET_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Helper function to get auth token
export const getAuthToken = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.token || localStorage.getItem('token') || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Helper function to build full API URL
export const buildApiUrl = (endpoint) => {
  const baseUrl = apiConfig.baseURL.replace(/\/$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${path}`;
};

export default apiConfig;
