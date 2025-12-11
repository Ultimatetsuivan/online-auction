import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string | number;
  originalError?: any;
}

export class ErrorHandler {
  static parseError(error: any): AppError {
    // Network errors
    if (!error.response && error.request) {
      return {
        type: ErrorType.NETWORK,
        message: 'Network connection failed. Please check your internet connection.',
        originalError: error,
      };
    }

    // Server errors
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      // Authentication errors
      if (status === 401) {
        return {
          type: ErrorType.AUTHENTICATION,
          message: data?.message || 'Your session has expired. Please login again.',
          code: status,
          originalError: error,
        };
      }

      // Validation errors
      if (status === 400 || status === 422) {
        return {
          type: ErrorType.VALIDATION,
          message: data?.message || data?.error || 'Invalid input. Please check your data.',
          code: status,
          originalError: error,
        };
      }

      // Server errors
      if (status >= 500) {
        return {
          type: ErrorType.SERVER,
          message: 'Server error. Please try again later.',
          code: status,
          originalError: error,
        };
      }

      // Other HTTP errors
      return {
        type: ErrorType.SERVER,
        message: data?.message || data?.error || `Error: ${status}`,
        code: status,
        originalError: error,
      };
    }

    // Unknown errors
    return {
      type: ErrorType.UNKNOWN,
      message: error.message || 'An unexpected error occurred.',
      originalError: error,
    };
  }

  static async handleError(error: any, showAlert = true): Promise<void> {
    const appError = this.parseError(error);

    // Log error
    console.error(`[${appError.type}]`, appError.message, appError.originalError);

    // Handle authentication errors
    if (appError.type === ErrorType.AUTHENTICATION) {
      try {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
      } catch (storageError) {
        console.error('Error clearing storage:', storageError);
      }
    }

    // Show alert if requested
    if (showAlert) {
      Alert.alert(
        this.getErrorTitle(appError.type),
        appError.message,
        [{ text: 'OK' }]
      );
    }
  }

  static getErrorTitle(type: ErrorType): string {
    switch (type) {
      case ErrorType.NETWORK:
        return 'Connection Error';
      case ErrorType.AUTHENTICATION:
        return 'Authentication Error';
      case ErrorType.VALIDATION:
        return 'Validation Error';
      case ErrorType.SERVER:
        return 'Server Error';
      default:
        return 'Error';
    }
  }

  static getErrorMessage(error: any): string {
    const appError = this.parseError(error);
    return appError.message;
  }
}

export default ErrorHandler;

