const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  comment: {
    type: String,
    trim: true,
    default: ""
  }
}, { timestamps: true });

reviewSchema.index({ product: 1, fromUser: 1 }, { unique: true });
reviewSchema.index({ toUser: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
