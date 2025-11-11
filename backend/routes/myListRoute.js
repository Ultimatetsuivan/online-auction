const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect } = require('../middleware/authMiddleware');
const SavedFilter = require('../models/SavedFilter');
const UserFollow = require('../models/UserFollow');

// Use existing Product model if already compiled
const Product = mongoose.models.Product || require('../models/Product');

// Get all saved filters
router.get('/filters', protect, async (req, res) => {
  try {
    const filters = await SavedFilter.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(filters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Save a new filter
router.post('/filters', protect, async (req, res) => {
  try {
    const { name, filterData, notifyOnNewProducts } = req.body;

    const filter = new SavedFilter({
      user: req.user._id,
      name,
      filterData,
      notifyOnNewProducts
    });

    await filter.save();
    res.status(201).json(filter);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a saved filter
router.delete('/filters/:id', protect, async (req, res) => {
  try {
    const filter = await SavedFilter.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!filter) {
      return res.status(404).json({ message: 'Filter not found' });
    }

    res.json({ message: 'Filter deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get products matching saved filters
router.get('/filters/:id/products', protect, async (req, res) => {
  try {
    const filter = await SavedFilter.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!filter) {
      return res.status(404).json({ message: 'Filter not found' });
    }

    // Build query based on filter data
    let query = {};
    if (filter.filterData.category) query.category = filter.filterData.category;
    if (filter.filterData.brand) query.brand = filter.filterData.brand;
    if (filter.filterData.minPrice || filter.filterData.maxPrice) {
      query.price = {};
      if (filter.filterData.minPrice) query.price.$gte = filter.filterData.minPrice;
      if (filter.filterData.maxPrice) query.price.$lte = filter.filterData.maxPrice;
    }
    if (filter.filterData.searchQuery) {
      query.$or = [
        { title: { $regex: filter.filterData.searchQuery, $options: 'i' } },
        { description: { $regex: filter.filterData.searchQuery, $options: 'i' } }
      ];
    }

    const products = await Product.find(query).sort({ createdAt: -1 }).limit(20);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all followed users
router.get('/following', protect, async (req, res) => {
  try {
    const follows = await UserFollow.find({ follower: req.user._id })
      .populate('following', 'name email')
      .sort({ createdAt: -1 });
    res.json(follows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Follow a user
router.post('/follow/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    // Check if already following
    const existingFollow = await UserFollow.findOne({
      follower: req.user._id,
      following: userId
    });

    if (existingFollow) {
      return res.status(400).json({ message: 'Already following this user' });
    }

    const follow = new UserFollow({
      follower: req.user._id,
      following: userId,
      notifyOnNewProducts: req.body.notifyOnNewProducts !== false
    });

    await follow.save();
    await follow.populate('following', 'name email');
    res.status(201).json(follow);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Unfollow a user
router.delete('/follow/:userId', protect, async (req, res) => {
  try {
    const follow = await UserFollow.findOneAndDelete({
      follower: req.user._id,
      following: req.params.userId
    });

    if (!follow) {
      return res.status(404).json({ message: 'Not following this user' });
    }

    res.json({ message: 'Unfollowed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get products from followed users
router.get('/following/products', protect, async (req, res) => {
  try {
    const follows = await UserFollow.find({ follower: req.user._id });
    const followedUserIds = follows.map(f => f.following);

    const products = await Product.find({ user: { $in: followedUserIds } })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
