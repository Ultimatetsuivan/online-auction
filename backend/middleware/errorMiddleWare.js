const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

/**
 * Centralized Error Handler Middleware
 * Handles all errors thrown in the application
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode;

  // Default to 500 if no status code
  let statusCode = error.statusCode || 500;

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(e => e.message).join(', ');
    error.message = `Буруу өгөгдөл: ${message}`;
    statusCode = 400;
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const fieldNames = {
      email: 'И-мэйл',
      phone: 'Утасны дугаар',
      username: 'Хэрэглэгчийн нэр',
      googleId: 'Google данс',
      eMongoliaId: 'eMongolia данс'
    };
    const fieldName = fieldNames[field] || field;
    error.message = `${fieldName} аль хэдийн бүртгэгдсэн байна`;
    statusCode = 409;
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    error.message = 'Буруу ID байна';
    statusCode = 404;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Буруу токен байна';
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Токены хугацаа дууссан байна';
    statusCode = 401;
  }

  // Handle Multer file upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      error.message = 'Файлын хэмжээ хэт том байна (max 5MB)';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      error.message = 'Хэт олон файл илгээсэн байна';
    } else {
      error.message = 'Файл байршуулахад алдаа гарлаа';
    }
    statusCode = 400;
  }

  // Determine if error is operational (expected) or programming error
  const isOperational = err.isOperational || err instanceof AppError;

  // Log error with appropriate level
  const logMeta = {
    statusCode,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    requestId: req.id,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    isOperational
  };

  if (statusCode >= 500) {
    // Server errors - log with full stack trace
    logger.error(error.message || 'Internal Server Error', {
      ...logMeta,
      stack: err.stack,
      originalError: err
    });
  } else if (statusCode >= 400) {
    // Client errors - log as warning
    logger.warn(error.message, logMeta);
  }

  // Prepare error response for client
  const errorResponse = {
    success: false,
    error: error.message || 'Серверийн алдаа гарлаа',
    statusCode
  };

  // Only include stack trace in development mode
  // NEVER leak stack traces in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (isDevelopment) {
    errorResponse.stack = err.stack;
    errorResponse.details = err;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Handle 404 - Not Found
 * Place this middleware after all routes
 */
const notFound = (req, res, next) => {
  const message = `Хуудас олдсонгүй - ${req.originalUrl}`;
  logger.warn('404 Not Found', {
    path: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  res.status(404).json({
    success: false,
    error: message,
    statusCode: 404
  });
};

module.exports = {
  errorHandler,
  notFound
};