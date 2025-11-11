const express = require('express');
const router = express.Router();
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
    getUnreadCount
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const { validateObjectId } = require('../middleware/validator');

// All notification routes require authentication
router.get('/', protect, getNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.put('/:id/read', protect, validateObjectId('id'), markAsRead);
router.post('/mark-all-read', protect, markAllAsRead);
router.delete('/:id', protect, validateObjectId('id'), deleteNotification);
router.delete('/clear-read', protect, clearReadNotifications);

module.exports = router;
