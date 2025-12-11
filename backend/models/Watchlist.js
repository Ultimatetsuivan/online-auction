const mongoose = require("mongoose");

const watchlistSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    notifyOnStart: {
        type: Boolean,
        default: true
    },
    notifyOnEndingSoon: {
        type: Boolean,
        default: true
    },
    notifyOnPriceChange: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure a user can only watch a product once
watchlistSchema.index({ user: 1, product: 1 }, { unique: true });

// Index for faster queries
watchlistSchema.index({ user: 1, createdAt: -1 });
watchlistSchema.index({ product: 1 });

const Watchlist = mongoose.model("Watchlist", watchlistSchema);
module.exports = Watchlist;
