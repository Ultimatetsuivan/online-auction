const express = require('express');
const router = express.Router();
const {
    getCurrentEULA,
    getLegalDocument,
    acceptEULA,
    checkEULAStatus,
    createLegalDocument,
    getAllLegalDocuments
} = require('../controllers/legalController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.get('/eula/current', getCurrentEULA);
router.get('/:type', getLegalDocument);

// User routes (require authentication)
router.post('/eula/accept', protect, acceptEULA);
router.get('/eula/status', protect, checkEULAStatus);

// Admin routes
router.post('/document', protect, admin, createLegalDocument);
router.get('/documents/all', protect, admin, getAllLegalDocuments);

module.exports = router;
