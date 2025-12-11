const express = require('express');
const router = express.Router();
const {
    getNotificationSettings,
    updateNotificationSettings,
    resetNotificationSettings
} = require('../controllers/notificationSettingsController');
const { protect } = require('../middleware/authMiddleware');

// All notification settings routes require authentication
router.get('/', protect, getNotificationSettings);
router.put('/', protect, updateNotificationSettings);
router.post('/reset', protect, resetNotificationSettings);

module.exports = router;
