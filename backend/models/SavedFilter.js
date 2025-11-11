const mongoose = require('mongoose');

const savedFilterSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  filterData: {
    category: String,
    brand: String,
    minPrice: Number,
    maxPrice: Number,
    searchQuery: String,
    customFilters: Object
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

// Index for faster queries
savedFilterSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('SavedFilter', savedFilterSchema);
