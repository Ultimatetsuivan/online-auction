const express = require('express');
const router = express.Router();
const {
    submitIdentityVerification,
    getMyVerificationStatus,
    getPendingVerifications,
    approveVerification,
    rejectVerification,
    getVerificationStats
} = require('../controllers/identityVerificationController');
const { protect, admin } = require('../middleware/authMiddleware');

// User routes (authenticated)
router.post('/submit', protect, submitIdentityVerification);
router.get('/my-status', protect, getMyVerificationStatus);

// Admin routes
router.get('/pending', protect, admin, getPendingVerifications);
router.post('/approve/:userId', protect, admin, approveVerification);
router.post('/reject/:userId', protect, admin, rejectVerification);
router.get('/stats', protect, admin, getVerificationStats);

module.exports = router;
