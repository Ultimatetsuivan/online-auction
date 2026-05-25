const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const biddingSchema = mongoose.Schema( {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      require: true,
      ref: "User",
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      require: true,
      ref: "Product",
    },
    price: {
      type: Number,
      require: [true, "Please add a Price"],
    },
  },
  { timestamps: true }
);

// ===== Database Indexes for Performance =====
// Compound index for finding highest bid on a product (sorted by price descending)
biddingSchema.index({ product: 1, price: -1, createdAt: -1 });

// Compound index for user's bid history on a specific product
biddingSchema.index({ user: 1, product: 1, createdAt: -1 });

// Index for user's complete bid history (sorted by date)
biddingSchema.index({ user: 1, createdAt: -1 });

// Index for product bid history
biddingSchema.index({ product: 1, createdAt: -1 });

const Bidding = mongoose.model("Bidding", biddingSchema)
module.exports = Bidding;