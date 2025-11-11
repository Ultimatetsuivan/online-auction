import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// API Configuration with environment variable support
const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:5000";

console.log('🌐 API Base URL:', API_BASE);

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000, // Increased to 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  async (config) => {
    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    console.log('🔧 Full URL:', config.baseURL + config.url);

    // Add auth token if available
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('🔑 Token attached to request');
      }
    } catch (error) {
      console.error('Error reading token from storage:', error);
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('❌ API Error:', error.response.status, error.response.data);

      // Handle 401 Unauthorized - token expired or invalid
      if (error.response.status === 401) {
        console.log('🔓 Token expired or invalid - clearing storage');
        try {
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
          console.log('🔄 User logged out due to invalid token');
        } catch (storageError) {
          console.error('Error clearing storage:', storageError);
        }
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('❌ Network Error:', error.message);
      console.error('🔍 Request config:', {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        timeout: error.config?.timeout,
      });
    } else {
      // Something else happened
      console.error('❌ Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
