const express = require('express');
const router = express.Router();
const {
  getRequests,
  getMyRequests,
  addRequest,
  getRequest,
  deleteRequest,
} = require('../controllers/requestController');
const { protect, admin } = require('../middleware/authMiddleware');

// Must come before /:id to avoid "my" being treated as an id param
router.get('/my', protect, getMyRequests);

router.route('/')
  .get(protect, admin, getRequests)
  .post(protect, addRequest);

router.route('/:id')
  .get(protect, getRequest)
  .delete(protect, deleteRequest);

module.exports = router;
