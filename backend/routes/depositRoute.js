const express = require('express');
const router = express.Router();
const {
    placeDeposit,
    getMyDeposits,
    getAllDeposits
} = require('../controllers/depositController');
const { protect, admin } = require('../middleware/authMiddleware');
const { requireEulaAcceptance } = require('../middleware/eulaMiddleware');

// User deposit routes
router.post('/', protect, requireEulaAcceptance, placeDeposit);
router.get('/my', protect, getMyDeposits);

// Admin deposit routes
router.get('/all', protect, admin, getAllDeposits);

module.exports = router;
