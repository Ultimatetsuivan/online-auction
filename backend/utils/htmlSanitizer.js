/**
 * HTML Sanitization Utility
 * Sanitizes user-generated HTML content to prevent XSS attacks
 */

const sanitizeHtml = require('sanitize-html');

/**
 * Sanitize HTML content for product descriptions
 * Allows only safe formatting tags and removes all scripts, event handlers, etc.
 *
 * @param {string} dirty - Unsanitized HTML from user
 * @returns {string} - Clean, safe HTML
 */
function sanitizeProductDescription(dirty) {
    if (!dirty || typeof dirty !== 'string') {
        return '';
    }

    const clean = sanitizeHtml(dirty, {
        // Allow only safe formatting tags
        allowedTags: [
            'p', 'br', 'strong', 'em', 'b', 'i', 'u',
            'ul', 'ol', 'li',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'blockquote', 'pre', 'code',
            'a', 'span', 'div'
        ],

        // Allow only safe attributes
        allowedAttributes: {
            'a': ['href', 'title', 'target', 'rel'],
            'span': ['class'],
            'div': ['class'],
            'p': ['class'],
            'code': ['class']
        },

        // Allowed URL schemes for links
        allowedSchemes: ['http', 'https', 'mailto'],

        // Allowed classes (for formatting)
        allowedClasses: {
            'p': ['text-*', 'font-*'],
            'span': ['text-*', 'font-*', 'bg-*'],
            'div': ['text-*'],
            'code': ['language-*']
        },

        // Enforce rel="noopener noreferrer" on external links
        transformTags: {
            'a': (tagName, attribs) => {
                return {
                    tagName: 'a',
                    attribs: {
                        ...attribs,
                        rel: 'noopener noreferrer', // Prevent tabnabbing
                        target: attribs.target || '_blank' // Open links in new tab
                    }
                };
            }
        },

        // Don't allow CSS or style attributes (prevents style-based attacks)
        allowedStyles: {},

        // Maximum nesting depth to prevent DoS
        nestingLimit: 10
    });

    return clean;
}

/**
 * Sanitize plain text content (strips all HTML)
 * @param {string} dirty - Content that may contain HTML
 * @returns {string} - Plain text without any HTML
 */
function sanitizeToPlainText(dirty) {
    if (!dirty || typeof dirty !== 'string') {
        return '';
    }

    return sanitizeHtml(dirty, {
        allowedTags: [], // No HTML tags allowed
        allowedAttributes: {}
    });
}

/**
 * Sanitize user bio/about section
 * More restrictive than product descriptions
 * @param {string} dirty - User-provided bio
 * @returns {string} - Clean bio text
 */
function sanitizeUserBio(dirty) {
    if (!dirty || typeof dirty !== 'string') {
        return '';
    }

    const clean = sanitizeHtml(dirty, {
        allowedTags: ['p', 'br', 'strong', 'em', 'b', 'i'],
        allowedAttributes: {},
        allowedSchemes: [],
        nestingLimit: 5
    });

    return clean;
}

/**
 * Sanitize comment or review text
 * @param {string} dirty - User comment
 * @returns {string} - Clean comment
 */
function sanitizeComment(dirty) {
    if (!dirty || typeof dirty !== 'string') {
        return '';
    }

    const clean = sanitizeHtml(dirty, {
        allowedTags: ['p', 'br', 'strong', 'em'],
        allowedAttributes: {},
        nestingLimit: 3
    });

    return clean;
}

module.exports = {
    sanitizeProductDescription,
    sanitizeToPlainText,
    sanitizeUserBio,
    sanitizeComment
};
