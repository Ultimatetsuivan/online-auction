/**
 * Input Sanitization Utilities
 * Provides functions to sanitize user input and prevent injection attacks
 */

/**
 * Escape special regex characters to prevent ReDoS attacks
 * @param {string} string - The string to escape
 * @returns {string} - Escaped string safe for use in regex
 */
function escapeRegex(string) {
    if (!string || typeof string !== 'string') {
        return '';
    }

    // Escape all special regex characters
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validate and sanitize search query
 * @param {string} query - Search query from user
 * @param {object} options - Validation options
 * @returns {object} - { isValid, sanitized, error }
 */
function sanitizeSearchQuery(query, options = {}) {
    const maxLength = options.maxLength || 100;
    const minLength = options.minLength || 1;

    if (!query || typeof query !== 'string') {
        return {
            isValid: false,
            sanitized: '',
            error: 'Хайлтын утга хоосон байна'
        };
    }

    // Trim whitespace
    const trimmed = query.trim();

    // Check length
    if (trimmed.length < minLength) {
        return {
            isValid: false,
            sanitized: '',
            error: `Хайлтын утга ${minLength}-аас дээш тэмдэгт байх ёстой`
        };
    }

    if (trimmed.length > maxLength) {
        return {
            isValid: false,
            sanitized: '',
            error: `Хайлтын утга ${maxLength}-аас бага тэмдэгт байх ёстой`
        };
    }

    // Escape regex special characters
    const sanitized = escapeRegex(trimmed);

    return {
        isValid: true,
        sanitized,
        error: null
    };
}

/**
 * Mask email address for logging (shows first 3 chars + domain)
 * @param {string} email - Email address
 * @returns {string} - Masked email (e.g., "abc***@example.com")
 */
function maskEmail(email) {
    if (!email || typeof email !== 'string' || !email.includes('@')) {
        return '***@***.***';
    }

    const [localPart, domain] = email.split('@');
    const maskedLocal = localPart.length > 3
        ? localPart.substring(0, 3) + '***'
        : '***';

    return `${maskedLocal}@${domain}`;
}

/**
 * Mask phone number for logging (shows last 4 digits)
 * @param {string} phone - Phone number
 * @returns {string} - Masked phone (e.g., "****5678")
 */
function maskPhone(phone) {
    if (!phone || typeof phone !== 'string') {
        return '****';
    }

    return phone.length > 4
        ? '****' + phone.slice(-4)
        : '****';
}

/**
 * Sanitize filename to prevent path traversal
 * @param {string} filename - Original filename
 * @returns {string} - Safe filename
 */
function sanitizeFilename(filename) {
    if (!filename || typeof filename !== 'string') {
        return 'unnamed';
    }

    // Remove path separators and null bytes
    let safe = filename.replace(/[\/\\:\0]/g, '_');

    // Remove leading dots to prevent hidden files
    safe = safe.replace(/^\.+/, '');

    // Limit length
    if (safe.length > 255) {
        const ext = safe.split('.').pop();
        safe = safe.substring(0, 255 - ext.length - 1) + '.' + ext;
    }

    // If empty after sanitization, use default
    if (!safe || safe.trim().length === 0) {
        return 'unnamed';
    }

    return safe;
}

/**
 * Remove sensitive data from object for logging
 * @param {object} obj - Object that may contain sensitive data
 * @param {array} sensitiveFields - Fields to mask (default: password, token, otp)
 * @returns {object} - Object with sensitive fields masked
 */
function maskSensitiveData(obj, sensitiveFields = ['password', 'token', 'otp', 'otpCode', 'secret', 'apiKey']) {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }

    const masked = { ...obj };

    for (const field of sensitiveFields) {
        if (masked[field]) {
            masked[field] = '***REDACTED***';
        }
    }

    // Handle nested email and phone
    if (masked.email) {
        masked.email = maskEmail(masked.email);
    }

    if (masked.phone) {
        masked.phone = maskPhone(masked.phone);
    }

    return masked;
}

module.exports = {
    escapeRegex,
    sanitizeSearchQuery,
    maskEmail,
    maskPhone,
    sanitizeFilename,
    maskSensitiveData
};
