/**
 * Error Handler Utility
 * Handles errors from the improved backend with standardized error responses
 */

/**
 * Extract error message from API error response
 * Handles new backend error format: { success: false, error: "message", statusCode: xxx }
 * @param {Error|Object} error - Error object from API
 * @returns {string} - User-friendly error message
 */
export const getErrorMessage = (error) => {
  // Check for response data (axios error)
  if (error?.response?.data) {
    const { error: errorMsg, message } = error.response.data;
    return errorMsg || message || 'Алдаа гарлаа';
  }

  // Check for direct error property (new backend format)
  if (error?.error) {
    return error.error;
  }

  // Check for message property
  if (error?.message) {
    return error.message;
  }

  // Network error
  if (error?.request) {
    return 'Сүлжээний алдаа. Интернет холболтоо шалгана уу';
  }

  // Default error message
  return 'Тодорхойгүй алдаа гарлаа';
};

/**
 * Check if error is authentication error (401)
 * @param {Error|Object} error - Error object
 * @returns {boolean}
 */
export const isAuthError = (error) => {
  return error?.response?.status === 401 || error?.statusCode === 401;
};

/**
 * Check if error is validation error (400)
 * @param {Error|Object} error - Error object
 * @returns {boolean}
 */
export const isValidationError = (error) => {
  return error?.response?.status === 400 || error?.statusCode === 400;
};

/**
 * Check if error is forbidden (403)
 * @param {Error|Object} error - Error object
 * @returns {boolean}
 */
export const isForbiddenError = (error) => {
  return error?.response?.status === 403 || error?.statusCode === 403;
};

/**
 * Check if error is not found (404)
 * @param {Error|Object} error - Error object
 * @returns {boolean}
 */
export const isNotFoundError = (error) => {
  return error?.response?.status === 404 || error?.statusCode === 404;
};

/**
 * Check if error is conflict (409) - race condition
 * @param {Error|Object} error - Error object
 * @returns {boolean}
 */
export const isConflictError = (error) => {
  return error?.response?.status === 409 || error?.statusCode === 409;
};

/**
 * Handle API error and show appropriate message
 * @param {Error|Object} error - Error object
 * @param {Function} showToast - Toast notification function (optional)
 * @returns {string} - Error message
 */
export const handleApiError = (error, showToast = null) => {
  const message = getErrorMessage(error);

  // Show toast if provided
  if (showToast && typeof showToast === 'function') {
    showToast(message, 'error');
  }

  // Log error in development
  if (import.meta.env.DEV) {
    console.error('API Error:', error);
  }

  return message;
};

/**
 * Validate search query before sending to backend
 * Matches backend validation rules
 * @param {string} query - Search query
 * @returns {Object} - { valid: boolean, error: string|null }
 */
export const validateSearchQuery = (query) => {
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
};

/**
 * Format error for display in UI
 * @param {Error|Object} error - Error object
 * @returns {Object} - { title: string, message: string, type: string }
 */
export const formatErrorForDisplay = (error) => {
  const message = getErrorMessage(error);

  if (isAuthError(error)) {
    return {
      title: 'Нэвтрэх шаардлагатай',
      message: 'Та нэвтэрч орно уу',
      type: 'auth'
    };
  }

  if (isValidationError(error)) {
    return {
      title: 'Буруу өгөгдөл',
      message,
      type: 'validation'
    };
  }

  if (isForbiddenError(error)) {
    return {
      title: 'Хандах эрх хүрэлцэхгүй',
      message,
      type: 'forbidden'
    };
  }

  if (isNotFoundError(error)) {
    return {
      title: 'Олдсонгүй',
      message,
      type: 'notFound'
    };
  }

  if (isConflictError(error)) {
    return {
      title: 'Давхардсан үйлдэл',
      message: 'Өөр хэрэглэгч яг одоо санал өгсөн байна. Дахин оролдоно уу',
      type: 'conflict'
    };
  }

  return {
    title: 'Алдаа',
    message,
    type: 'error'
  };
};

export default {
  getErrorMessage,
  isAuthError,
  isValidationError,
  isForbiddenError,
  isNotFoundError,
  isConflictError,
  handleApiError,
  validateSearchQuery,
  formatErrorForDisplay
};
