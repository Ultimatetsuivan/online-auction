const express = require('express');
const router = express.Router();
const {
    addToWatchlist,
    removeFromWatchlist,
    getMyWatchlist,
    checkWatchlist,
    getWatchlistCount
} = require('../controllers/watchlistController');
const { protect } = require('../middleware/authMiddleware');
const { validateObjectId } = require('../middleware/validator');

// Watchlist routes (all require authentication except count)
router.post('/:productId', protect, validateObjectId('productId'), addToWatchlist);
router.delete('/:productId', protect, validateObjectId('productId'), removeFromWatchlist);
router.get('/my', protect, getMyWatchlist);
router.get('/:productId/check', protect, validateObjectId('productId'), checkWatchlist);
router.get('/:productId/count', validateObjectId('productId'), getWatchlistCount);

module.exports = router;
