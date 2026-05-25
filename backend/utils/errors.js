/**
 * Custom Error Classes
 * Provides standardized error handling across the application
 */

/**
 * Base Application Error
 * All custom errors extend from this class
 */
class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

        // Capture stack trace
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * 400 Bad Request - Validation Error
 * Use when user input is invalid
 */
class ValidationError extends AppError {
    constructor(message = 'Буруу өгөгдөл илгээсэн байна') {
        super(message, 400);
    }
}

/**
 * 401 Unauthorized - Authentication Error
 * Use when user is not authenticated
 */
class AuthenticationError extends AppError {
    constructor(message = 'Нэвтрэх шаардлагатай') {
        super(message, 401);
    }
}

/**
 * 403 Forbidden - Authorization Error
 * Use when user is authenticated but lacks permission
 */
class ForbiddenError extends AppError {
    constructor(message = 'Хандах эрх хүрэлцэхгүй байна') {
        super(message, 403);
    }
}

/**
 * 404 Not Found Error
 * Use when requested resource doesn't exist
 */
class NotFoundError extends AppError {
    constructor(resource = 'Хуудас') {
        super(`${resource} олдсонгүй`, 404);
        this.resource = resource;
    }
}

/**
 * 409 Conflict Error
 * Use when there's a conflict (e.g., duplicate entry, race condition)
 */
class ConflictError extends AppError {
    constructor(message = 'Өгөгдөл давхцаж байна') {
        super(message, 409);
    }
}

/**
 * 422 Unprocessable Entity
 * Use when request is well-formed but semantically incorrect
 */
class UnprocessableEntityError extends AppError {
    constructor(message = 'Боловсруулах боломжгүй хүсэлт') {
        super(message, 422);
    }
}

/**
 * 429 Too Many Requests
 * Use when rate limit is exceeded
 */
class RateLimitError extends AppError {
    constructor(message = 'Хэт олон хүсэлт илгээсэн байна. Түр хүлээнэ үү') {
        super(message, 429);
    }
}

/**
 * 500 Internal Server Error
 * Use for unexpected server errors
 */
class InternalServerError extends AppError {
    constructor(message = 'Серверийн алдаа гарлаа', isOperational = false) {
        super(message, 500, isOperational);
    }
}

/**
 * Database Error
 * Use for database-related errors
 */
class DatabaseError extends AppError {
    constructor(message = 'Өгөгдлийн санд алдаа гарлаа', originalError = null) {
        super(message, 500, false);
        this.originalError = originalError;
    }
}

/**
 * Transaction Error
 * Use when database transaction fails
 */
class TransactionError extends AppError {
    constructor(message = 'Гүйлгээ амжилтгүй боллоо', originalError = null) {
        super(message, 500, true);
        this.originalError = originalError;
    }
}

/**
 * Auction Error
 * Use for auction-specific business logic errors
 */
class AuctionError extends AppError {
    constructor(message, statusCode = 400) {
        super(message, statusCode);
    }
}

/**
 * Payment Error
 * Use for payment-related errors
 */
class PaymentError extends AppError {
    constructor(message = 'Төлбөрийн алдаа гарлаа', statusCode = 402) {
        super(message, statusCode);
    }
}

/**
 * File Upload Error
 * Use for file upload failures
 */
class FileUploadError extends AppError {
    constructor(message = 'Файл байршуулахад алдаа гарлаа') {
        super(message, 400);
    }
}

module.exports = {
    AppError,
    ValidationError,
    AuthenticationError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    UnprocessableEntityError,
    RateLimitError,
    InternalServerError,
    DatabaseError,
    TransactionError,
    AuctionError,
    PaymentError,
    FileUploadError
};
