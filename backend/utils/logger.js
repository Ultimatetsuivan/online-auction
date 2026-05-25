/**
 * Logger Utility
 * Wrapper around Winston logger with additional utilities
 */

const logger = require('../config/logger');
const { maskSensitiveData } = require('./inputSanitization');

/**
 * Log info level message
 * @param {string} message - Log message
 * @param {object} meta - Additional metadata (will be sanitized)
 */
function info(message, meta = {}) {
    const sanitizedMeta = maskSensitiveData(meta);
    logger.info(message, sanitizedMeta);
}

/**
 * Log error level message
 * @param {string} message - Error message
 * @param {Error|object} error - Error object or metadata
 */
function error(message, error = {}) {
    if (error instanceof Error) {
        logger.error(message, {
            message: error.message,
            stack: error.stack,
            name: error.name,
            code: error.code
        });
    } else {
        const sanitizedMeta = maskSensitiveData(error);
        logger.error(message, sanitizedMeta);
    }
}

/**
 * Log warning level message
 * @param {string} message - Warning message
 * @param {object} meta - Additional metadata
 */
function warn(message, meta = {}) {
    const sanitizedMeta = maskSensitiveData(meta);
    logger.warn(message, sanitizedMeta);
}

/**
 * Log debug level message (only in development)
 * @param {string} message - Debug message
 * @param {object} meta - Additional metadata
 */
function debug(message, meta = {}) {
    const sanitizedMeta = maskSensitiveData(meta);
    logger.debug(message, sanitizedMeta);
}

/**
 * Log HTTP request
 * @param {string} message - HTTP log message
 * @param {object} meta - Request metadata
 */
function http(message, meta = {}) {
    // Don't log sensitive request data
    const safeMeta = {
        method: meta.method,
        url: meta.url,
        statusCode: meta.statusCode,
        duration: meta.duration,
        userId: meta.userId,
        requestId: meta.requestId,
        ip: meta.ip
    };
    logger.http(message, safeMeta);
}

/**
 * Log authentication events (never log credentials)
 * @param {string} event - Auth event type (login, logout, register, etc.)
 * @param {object} meta - Event metadata
 */
function auth(event, meta = {}) {
    const safeMeta = {
        event,
        userId: meta.userId,
        email: meta.email ? require('./inputSanitization').maskEmail(meta.email) : undefined,
        phone: meta.phone ? require('./inputSanitization').maskPhone(meta.phone) : undefined,
        method: meta.method, // e.g., 'email', 'google', 'phone'
        success: meta.success,
        ip: meta.ip,
        timestamp: new Date().toISOString()
    };
    logger.info(`AUTH: ${event}`, safeMeta);
}

/**
 * Log security events (failed logins, suspicious activity, etc.)
 * @param {string} event - Security event type
 * @param {object} meta - Event metadata
 */
function security(event, meta = {}) {
    const safeMeta = maskSensitiveData(meta);
    logger.warn(`SECURITY: ${event}`, safeMeta);
}

/**
 * Log audit trail for critical operations
 * @param {string} action - Action performed
 * @param {object} meta - Action metadata
 */
function audit(action, meta = {}) {
    const auditMeta = {
        action,
        userId: meta.userId,
        targetId: meta.targetId,
        targetType: meta.targetType,
        changes: meta.changes,
        timestamp: new Date().toISOString(),
        ip: meta.ip
    };
    logger.info(`AUDIT: ${action}`, auditMeta);
}

/**
 * Log transaction events
 * @param {string} event - Transaction event
 * @param {object} meta - Transaction metadata
 */
function transaction(event, meta = {}) {
    const txMeta = {
        event,
        transactionId: meta.transactionId,
        userId: meta.userId,
        amount: meta.amount,
        productId: meta.productId,
        status: meta.status,
        timestamp: new Date().toISOString()
    };
    logger.info(`TRANSACTION: ${event}`, txMeta);
}

module.exports = {
    info,
    error,
    warn,
    debug,
    http,
    auth,
    security,
    audit,
    transaction,
    // Expose raw logger for advanced usage
    raw: logger
};
