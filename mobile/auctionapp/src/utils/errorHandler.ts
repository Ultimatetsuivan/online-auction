import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT', // Race condition - 409
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

      // Forbidden errors
      if (status === 403) {
        return {
          type: ErrorType.FORBIDDEN,
          message: data?.error || data?.message || 'Хандах эрх хүрэлцэхгүй байна',
          code: status,
          originalError: error,
        };
      }

      // Not found errors
      if (status === 404) {
        return {
          type: ErrorType.NOT_FOUND,
          message: data?.error || data?.message || 'Олдсонгүй',
          code: status,
          originalError: error,
        };
      }

      // Conflict errors (race condition)
      if (status === 409) {
        return {
          type: ErrorType.CONFLICT,
          message: data?.error || data?.message || 'Өөр хэрэглэгч яг одоо санал өгсөн байна. Дахин оролдоно уу',
          code: status,
          originalError: error,
        };
      }

      // Validation errors
      if (status === 400 || status === 422) {
        return {
          type: ErrorType.VALIDATION,
          message: data?.error || data?.message || 'Буруу өгөгдөл илгээсэн байна',
          code: status,
          originalError: error,
        };
      }

      // Server errors
      if (status >= 500) {
        return {
          type: ErrorType.SERVER,
          message: 'Серверийн алдаа гарлаа. Дараа дахин оролдоно уу',
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
        return 'Сүлжээний алдаа';
      case ErrorType.AUTHENTICATION:
        return 'Нэвтрэх шаардлагатай';
      case ErrorType.VALIDATION:
        return 'Буруу өгөгдөл';
      case ErrorType.FORBIDDEN:
        return 'Хандах эрх хүрэлцэхгүй';
      case ErrorType.NOT_FOUND:
        return 'Олдсонгүй';
      case ErrorType.CONFLICT:
        return 'Давхардсан үйлдэл';
      case ErrorType.SERVER:
        return 'Серверийн алдаа';
      default:
        return 'Алдаа';
    }
  }

  static getErrorMessage(error: any): string {
    const appError = this.parseError(error);
    return appError.message;
  }

  /**
   * Check if error is a conflict error (409 - race condition)
   */
  static isConflictError(error: any): boolean {
    const appError = this.parseError(error);
    return appError.type === ErrorType.CONFLICT;
  }

  /**
   * Check if error is a validation error
   */
  static isValidationError(error: any): boolean {
    const appError = this.parseError(error);
    return appError.type === ErrorType.VALIDATION;
  }
}

/**
 * Validate search query
 * Matches backend validation rules
 */
export function validateSearchQuery(query: string): { valid: boolean; error: string | null } {
  if (!query || typeof query !== 'string') {
    return { valid: false, error: 'Хайлтын утга хоосон байна' };
  }

  const trimmed = query.trim();

  if (trimmed.length < 1) {
    return { valid: false, error: 'Хайлтын утга хоосон байна' };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'Хайлтын утга 100-аас бага тэмдэгт байх ёстой' };
  }

  return { valid: true, error: null };
}

export default ErrorHandler;

