const mongoose = require('mongoose');

const userFollowSchema = new mongoose.Schema({
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  following: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notifyOnNewProducts: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate follows
userFollowSchema.index({ follower: 1, following: 1 }, { unique: true });

// Index for faster queries
userFollowSchema.index({ follower: 1, createdAt: -1 });
userFollowSchema.index({ following: 1 });

module.exports = mongoose.model('UserFollow', userFollowSchema);
