const mongoose = require("mongoose");
const cron = require('node-cron');
const productSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        unique: true
    },
    description: {
        type: String,
        required: false,
        trim: true,
    },
   images: {
        type: [{
            url: String,
            publicId: String,
            isPrimary: {
                type: Boolean,
                default: false 
            }
        }],
        validate: [arrayLimit],
        default: []
    },
    category: {
        type: String,
        required: true,
        default: "General"
    },
    brand: {
        type: String,
        trim: true
    },
    color: {
        type: String,
        trim: true
    },
    condition: {
        type: String,
        enum: ['new', 'used', 'refurbished', 'like-new'],
        trim: true
    },
    size: {
        type: String,
        trim: true
    },
    commission: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: true
    },
    bidThreshold: {
        type: Number,
        default: null  
    },
    height: {
        type: Number
    },
    length: {
        type: Number
    },
    width: {
        type: Number
    },
    weight: {
        type: Number
    },
    currentBid: {
        type: Number,
        default: 0
    },
    highestBidder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    // ===== Yahoo Auctions-style Start System =====
    // Start mode: "immediate" or "scheduled"
    startMode: {
        type: String,
        enum: ['immediate', 'scheduled'],
        default: 'immediate',
        required: true
    },
    // Auction start time (UTC)
    auctionStart: {
        type: Date,
        required: true,
        default: Date.now
    },
    // Auction duration in days
    auctionDuration: {
        type: Number,
        required: true,
        default: 7 // Default 7 days
    },
    // Auction end time (calculated: auctionStart + duration)
    bidDeadline: {
        type: Date,
        required: true
    },
    // Auction status: "scheduled", "active", or "ended"
    auctionStatus: {
        type: String,
        enum: ['scheduled', 'active', 'ended'],
        default: 'active'
    },
    // ===== End of Start System =====
    verified: {
        type: Boolean,
        default: false
    },
    sold: {
        type: Boolean,
        default: false
    },
    soldTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    available: {
        type: Boolean,
        default: true
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
function arrayLimit(val) {
    return val.length <= 3;
}

productSchema.index({ 
    title: 'text', 
    description: 'text',
    category: 'text'
});

// Pre-save hook: Handle status transitions and availability
productSchema.pre('save', function(next) {
    const now = new Date();

    // Update auction status based on time
    if (this.auctionStart && this.bidDeadline) {
        if (now < this.auctionStart) {
            // Auction hasn't started yet
            this.auctionStatus = 'scheduled';
            this.available = false; // Not available for bidding yet
        } else if (now >= this.auctionStart && now < this.bidDeadline) {
            // Auction is currently active
            this.auctionStatus = 'active';
            this.available = true; // Available for bidding
        } else {
            // Auction has ended
            this.auctionStatus = 'ended';
            this.available = false; // No longer available for bidding
        }
    }

    // Check if item sold via bidThreshold
    if (this.bidThreshold && this.currentBid >= this.bidThreshold) {
        this.sold = true;
        this.soldTo = this.highestBidder;
        this.available = false;
        this.auctionStatus = 'ended';
    }

    next();
});

productSchema.virtual('timeRemaining').get(function() {
    if (!this.bidDeadline) return null;
    return this.bidDeadline - new Date();
});

// Static method: Activate scheduled auctions that should start now
productSchema.statics.activateScheduledAuctions = async function() {
    const now = new Date();

    const result = await this.updateMany(
        {
            auctionStatus: 'scheduled',
            auctionStart: { $lte: now }
        },
        {
            $set: {
                auctionStatus: 'active',
                available: true
            }
        }
    );

    if (result.modifiedCount > 0) {
        console.log(`[Auction Scheduler] Activated ${result.modifiedCount} scheduled auction(s)`);
    }

    return result.modifiedCount;
};

// Static method: Mark expired auctions as ended
productSchema.statics.updateExpiredAuctions = async function() {
    const now = new Date();

    const result = await this.updateMany(
        {
            auctionStatus: 'active',
            bidDeadline: { $lte: now }
        },
        {
            $set: {
                available: false,
                auctionStatus: 'ended'
            }
        }
    );

    if (result.modifiedCount > 0) {
        console.log(`[Auction Scheduler] Ended ${result.modifiedCount} expired auction(s)`);
    }

    return result.modifiedCount;
};

module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);