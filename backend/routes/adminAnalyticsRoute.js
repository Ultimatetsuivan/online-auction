const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getSalesChart,
    getRecentUsers,
    getTopSellers,
    getCategoryStats,
    getUserActivityChart
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// All admin analytics routes require admin authentication
router.get('/stats', protect, admin, getDashboardStats);
router.get('/sales-chart', protect, admin, getSalesChart);
router.get('/recent-users', protect, admin, getRecentUsers);
router.get('/top-sellers', protect, admin, getTopSellers);
router.get('/category-stats', protect, admin, getCategoryStats);
router.get('/user-activity', protect, admin, getUserActivityChart);

module.exports = router;
