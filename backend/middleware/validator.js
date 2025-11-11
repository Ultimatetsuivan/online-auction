const { body, param, validationResult } = require('express-validator');

// Middleware to check validation results
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Утга буруу байна',
            details: errors.array()
        });
    }
    next();
};

// Phone number validation
const validatePhone = [
    body('phone')
        .trim()
        .matches(/^[0-9]{8}$/)
        .withMessage('Утасны дугаар 8 оронтой тоо байх ёстой'),
    validate
];

// OTP validation
const validateOTP = [
    body('phone')
        .trim()
        .matches(/^[0-9]{8}$/)
        .withMessage('Утасны дугаар 8 оронтой тоо байх ёстой'),
    body('code')
        .trim()
        .matches(/^[0-9]{6}$/)
        .withMessage('Код 6 оронтой тоо байх ёстой'),
    validate
];

// Product validation
const validateProduct = [
    body('title')
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Гарчиг 3-100 тэмдэгт байх ёстой')
        .escape(),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Тайлбар 2000 тэмдэгтээс ихгүй байх ёстой')
        .escape(),
    body('price')
        .isFloat({ min: 1000, max: 100000000 })
        .withMessage('Үнэ 1,000 - 100,000,000 ₮ хооронд байх ёстой'),
    body('category')
        .trim()
        .notEmpty()
        .withMessage('Ангилал заавал шаардлагатай'),
    body('bidDeadline')
        .isISO8601()
        .withMessage('Дуусах хугацаа буруу байна')
        .custom((value) => {
            const deadline = new Date(value);
            const now = new Date();
            if (deadline <= now) {
                throw new Error('Дуусах хугацаа одоогоос хойш байх ёстой');
            }
            return true;
        }),
    validate
];

// Bid validation
const validateBid = [
    body('price')
        .isFloat({ min: 0 })
        .withMessage('Үнэ 0-ээс их байх ёстой'),
    validate
];

// Payment amount validation
const validatePaymentAmount = [
    body('amount')
        .isFloat({ min: 5000, max: 10000000 })
        .withMessage('Дүн 5,000 - 10,000,000 ₮ хооронд байх ёстой'),
    validate
];

// User registration validation
const validateRegistration = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Нэр 2-50 тэмдэгт байх ёстой')
        .escape(),
    body('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('И-мэйл хаяг буруу байна')
        .normalizeEmail(),
    body('password')
        .optional()
        .isLength({ min: 6 })
        .withMessage('Нууц үг 6-аас дээш тэмдэгт байх ёстой'),
    validate
];

// MongoDB ObjectId validation
const validateObjectId = (paramName = 'id') => [
    param(paramName)
        .matches(/^[0-9a-fA-F]{24}$/)
        .withMessage('ID буруу байна'),
    validate
];

module.exports = {
    validate,
    validatePhone,
    validateOTP,
    validateProduct,
    validateBid,
    validatePaymentAmount,
    validateRegistration,
    validateObjectId
};
