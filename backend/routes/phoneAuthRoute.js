const express = require('express');
const router = express.Router();
const {
    sendPhoneOTP,
    verifyPhoneOTP,
    registerWithPhone,
    refreshAccessToken,
    registerFCMToken,
    removeFCMToken,
    logout
} = require('../controllers/phoneAuthController');
const { protect } = require('../middleware/authMiddleware');
const { otpLimiter, loginLimiter } = require('../middleware/rateLimiter');
const { validatePhone, validateOTP, validateRegistration } = require('../middleware/validator');

// Phone authentication routes
router.post('/send-otp', otpLimiter, validatePhone, sendPhoneOTP);
router.post('/verify-otp', loginLimiter, validateOTP, verifyPhoneOTP);
router.post('/register-phone', loginLimiter, validateRegistration, validateOTP, registerWithPhone);

// Token management
router.post('/refresh-token', refreshAccessToken);
router.post('/logout', protect, logout);

// FCM token management
router.post('/fcm-token', protect, registerFCMToken);
router.delete('/fcm-token/:token', protect, removeFCMToken);

module.exports = router;
