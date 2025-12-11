const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  type: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ["pending", "resolved"],
    default: "pending"
  },
  resolutionNote: {
    type: String,
    default: ""
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  resolvedAt: {
    type: Date
  }
}, { timestamps: true });

reportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Report", reportSchema);
