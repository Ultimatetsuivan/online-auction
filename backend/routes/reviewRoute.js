const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { 
  createReview, 
  getReviewsForUser, 
  getReviewsForProduct 
} = require("../controllers/reviewController");

const router = express.Router();

router.post("/", protect, createReview);
router.get("/user/:userId", getReviewsForUser);
router.get("/product/:productId", getReviewsForProduct);

module.exports = router;
