/**
 * API Client Utility
 * Centralized API client with improved error handling
 */

import axios from 'axios';
import { apiConfig, getAuthToken } from '../config/api';
import { handleApiError, isAuthError } from './errorHandler';

// Create axios instance
const apiClient = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: apiConfig.timeout,
  headers: apiConfig.headers,
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle auth errors - redirect to login
    if (isAuthError(error)) {
      // Clear local storage
      localStorage.removeItem('user');
      localStorage.removeItem('token');

      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?session=expired';
      }
    }

    return Promise.reject(error);
  }
);

/**
 * GET request
 * @param {string} url - Endpoint URL
 * @param {Object} config - Axios config
 * @returns {Promise} - Response data
 */
export const get = async (url, config = {}) => {
  try {
    const response = await apiClient.get(url, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * POST request
 * @param {string} url - Endpoint URL
 * @param {Object} data - Request body
 * @param {Object} config - Axios config
 * @returns {Promise} - Response data
 */
export const post = async (url, data = {}, config = {}) => {
  try {
    const response = await apiClient.post(url, data, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * PUT request
 * @param {string} url - Endpoint URL
 * @param {Object} data - Request body
 * @param {Object} config - Axios config
 * @returns {Promise} - Response data
 */
export const put = async (url, data = {}, config = {}) => {
  try {
    const response = await apiClient.put(url, data, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * DELETE request
 * @param {string} url - Endpoint URL
 * @param {Object} config - Axios config
 * @returns {Promise} - Response data
 */
export const del = async (url, config = {}) => {
  try {
    const response = await apiClient.delete(url, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Upload file with progress tracking
 * @param {string} url - Endpoint URL
 * @param {FormData} formData - Form data with files
 * @param {Function} onProgress - Progress callback
 * @returns {Promise} - Response data
 */
export const uploadFile = async (url, formData, onProgress = null) => {
  try {
    const response = await apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default {
  get,
  post,
  put,
  delete: del,
  uploadFile,
  client: apiClient,
};
