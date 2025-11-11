const express = require('express');
const router = express.Router();
const {
    qpayWebhook,
    verifyPayment
} = require('../controllers/paymentWebhookController');
const { protect, admin } = require('../middleware/authMiddleware');

// QPay webhook (no auth - called by QPay servers)
router.post('/qpay-webhook', qpayWebhook);

// Manual payment verification (admin only)
router.get('/verify/:invoiceId', protect, admin, verifyPayment);

module.exports = router;
