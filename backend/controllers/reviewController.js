const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Review = require("../models/Review");
const Product = require("../models/Product");
const User = require("../models/User");

// Create a review (buyer -> seller)
const createReview = asyncHandler(async (req, res) => {
  const fromUserId = req.user._id;
  const { productId, toUserId, rating, comment } = req.body;

  if (!productId || !toUserId || !rating) {
    return res.status(400).json({ message: "productId, toUserId, and rating are required" });
  }

  const numericRating = Number(rating);
  if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ message: "rating must be between 1 and 5" });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const toUser = await User.findById(toUserId);
  if (!toUser) {
    return res.status(404).json({ message: "Recipient user not found" });
  }

  try {
    const review = await Review.create({
      product: productId,
      toUser: toUserId,
      fromUser: fromUserId,
      rating: numericRating,
      comment: comment || ""
    });

    return res.status(201).json({ success: true, review });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "You already reviewed this product" });
    }
    throw err;
  }
});

// Reviews written about a user (e.g., seller rating)
const getReviewsForUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const reviews = await Review.find({ toUser: userId })
    .populate("fromUser", "name email")
    .populate("product", "title images")
    .sort({ createdAt: -1 });

  const aggregate = mongoose.Types.ObjectId.isValid(userId)
    ? await Review.aggregate([
        { $match: { toUser: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: "$toUser", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } }
      ])
    : [];

  const stats = aggregate[0] || { avgRating: null, count: 0 };

  res.status(200).json({
    reviews,
    averageRating: stats.avgRating,
    count: stats.count
  });
});

// Reviews for a product
const getReviewsForProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const reviews = await Review.find({ product: productId })
    .populate("fromUser", "name email")
    .populate("toUser", "name email")
    .sort({ createdAt: -1 });

  const aggregate = mongoose.Types.ObjectId.isValid(productId)
    ? await Review.aggregate([
        { $match: { product: new mongoose.Types.ObjectId(productId) } },
        { $group: { _id: "$product", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } }
      ])
    : [];

  const stats = aggregate[0] || { avgRating: null, count: 0 };

  res.status(200).json({
    reviews,
    averageRating: stats.avgRating,
    count: stats.count
  });
});

module.exports = {
  createReview,
  getReviewsForUser,
  getReviewsForProduct
};
