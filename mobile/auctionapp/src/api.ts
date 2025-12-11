import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ENV from "./config/env";
import { retryRequest } from "./utils/network";
import ErrorHandler, { ErrorType } from "./utils/errorHandler";
import { cacheManager } from "./utils/cache";

// API Configuration with environment variable support
const API_BASE = ENV.API_BASE_URL;

// Only log API URL in development
if (__DEV__) {
  console.log('🌐 API Base URL:', API_BASE);
}

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
    // Only log request details in development
    if (__DEV__) {
      console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
      console.log('🔧 Full URL:', config.baseURL + config.url);
    }

    // Add auth token if available
    try {
      const token = await AsyncStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
        if (__DEV__) {
          console.log('🔑 Token attached to request');
        }
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

// Response interceptor for error handling and caching
api.interceptors.response.use(
  (response) => {
    // Only log successful responses in development
    if (__DEV__) {
      console.log(`✅ ${response.status} ${response.config.url}`);
    }
    
    // Cache GET requests
    if (response.config.method === 'get' && response.config.url) {
      const cacheKey = `api_${response.config.url}`;
      cacheManager.setMemory(cacheKey, response.data, 2 * 60 * 1000); // 2 minutes
    }
    
    return response;
  },
  async (error: AxiosError) => {
    // Use centralized error handler
    const appError = ErrorHandler.parseError(error);
    
    // Only log detailed errors in development
    if (__DEV__) {
      console.error(`❌ [${appError.type}] ${appError.message}`, {
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      // In production, only log error type and message
      console.error(`❌ [${appError.type}] ${appError.message}`);
    }

    // Handle 401 Unauthorized - token expired or invalid
    if (appError.type === ErrorType.AUTHENTICATION) {
      if (__DEV__) {
        console.log('🔓 Token expired or invalid - clearing storage');
      }
      try {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        if (__DEV__) {
          console.log('🔄 User logged out due to invalid token');
        }
      } catch (storageError) {
        console.error('Error clearing storage:', storageError);
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to make API calls with retry logic
export const apiWithRetry = async (requestFn: () => Promise<any>, maxRetries = 3) => {
  return retryRequest(requestFn, maxRetries);
};

// Helper function to make cached API calls
export const apiWithCache = async (
  url: string,
  config: AxiosRequestConfig = {},
  ttl: number = 2 * 60 * 1000
): Promise<AxiosResponse> => {
  // Check cache first
  const cacheKey = `api_${url}`;
  const cached = cacheManager.getMemory(cacheKey);
  
  if (cached && !config.params?.refresh) {
    // Create a mock response object for cached data
    const mockConfig: AxiosRequestConfig = {
      url,
      method: 'get',
      ...config,
    };
    
    return {
      data: cached,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: mockConfig,
    } as AxiosResponse;
  }

  // Fetch from API
  const response = await api.get(url, config);
  
  // Cache the response
  cacheManager.setMemory(cacheKey, response.data, ttl);
  
  return response;
};

export default api;

