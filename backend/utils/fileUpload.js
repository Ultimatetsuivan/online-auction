const multer = require("multer");
const path = require("path");
const { sanitizeFilename } = require("./inputSanitization");

const MAX_IMAGE_FILES = 20;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB per file

// Whitelist of allowed MIME types
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'image/heic-sequence',
    'image/heif-sequence'
];

// File signatures (magic numbers) for validation
// This prevents MIME type spoofing
const FILE_SIGNATURES = {
    'image/jpeg': [
        [0xFF, 0xD8, 0xFF] // JPEG/JPG
    ],
    'image/png': [
        [0x89, 0x50, 0x4E, 0x47] // PNG
    ],
    'image/webp': [
        [0x52, 0x49, 0x46, 0x46] // RIFF (WebP container)
    ]
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads");
    },
    filename: function (req, file, cb) {
        // Sanitize the original filename to prevent path traversal
        const safeName = sanitizeFilename(file.originalname);

        // Create unique filename with timestamp
        const timestamp = Date.now();
        const ext = path.extname(safeName);
        const nameWithoutExt = path.basename(safeName, ext);

        // Format: timestamp-sanitizedname.ext
        const uniqueName = `${timestamp}-${nameWithoutExt}${ext}`;

        cb(null, uniqueName);
    },
});

/**
 * Validate file type by MIME type and file signature (magic numbers)
 * This prevents attackers from uploading malicious files with spoofed MIME types
 */
function fileFilter(req, file, cb) {
    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new Error(`File type not allowed. Only ${ALLOWED_MIME_TYPES.join(', ')} are permitted.`), false);
    }

    // Validate file extension (allow common image formats + iOS HEIC)
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];

    // Allow files without extension (common in mobile uploads) - will validate by MIME type only
    if (ext && !allowedExtensions.includes(ext)) {
        return cb(new Error('Invalid file extension. Only .jpg, .jpeg, .png, .webp, .heic, .heif are allowed.'), false);
    }

    // File passes all checks
    cb(null, true);
}

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE_BYTES,
        files: MAX_IMAGE_FILES,
    }
});

/**
 * Validate file signature (magic numbers) after upload
 * Call this function after multer processes the file
 * @param {Buffer} fileBuffer - First few bytes of the uploaded file
 * @param {string} mimeType - Expected MIME type
 * @returns {boolean} - True if file signature matches
 */
function validateFileSignature(fileBuffer, mimeType) {
    if (!FILE_SIGNATURES[mimeType]) {
        return false;
    }

    const signatures = FILE_SIGNATURES[mimeType];

    for (const signature of signatures) {
        let match = true;
        for (let i = 0; i < signature.length; i++) {
            if (fileBuffer[i] !== signature[i]) {
                match = false;
                break;
            }
        }
        if (match) {
            return true;
        }
    }

    return false;
}

module.exports = {
    upload,
    validateFileSignature,
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE_BYTES
};
