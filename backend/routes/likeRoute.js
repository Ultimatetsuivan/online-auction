const express = require('express');
const router = express.Router();
const {
    toggleLike,
    getMyLikes,
    checkLike,
    getLikeCount
} = require('../controllers/likeController');
const { protect } = require('../middleware/authMiddleware');
const { validateObjectId } = require('../middleware/validator');

// Like routes (all require authentication)
router.post('/:productId', protect, validateObjectId('productId'), toggleLike);
router.get('/my', protect, getMyLikes);
router.get('/:productId/check', protect, validateObjectId('productId'), checkLike);
router.get('/:productId/count', validateObjectId('productId'), getLikeCount);

module.exports = router;
