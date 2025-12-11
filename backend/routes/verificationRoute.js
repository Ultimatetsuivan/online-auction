const express = require('express');
const router = express.Router();
const {
    getVerificationRequirements,
    requestVerification,
    getPendingVerifications,
    approveVerification,
    rejectVerification,
    getCertificate,
    getVerificationStatus
} = require('../controllers/verificationController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.get('/requirements/:category', getVerificationRequirements);
router.get('/certificate/:productId', getCertificate);
router.get('/status/:productId', getVerificationStatus);

// Seller routes (authenticated)
router.post('/request/:productId', protect, requestVerification);

// Admin routes
router.get('/pending', protect, admin, getPendingVerifications);
router.post('/approve/:productId', protect, admin, approveVerification);
router.post('/reject/:productId', protect, admin, rejectVerification);

module.exports = router;
