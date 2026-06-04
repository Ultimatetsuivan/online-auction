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
        type: String
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
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: false // Changed to false to allow migration
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
    reservePrice: {
        type: Number,
        default: null
    },
    buyNowPrice: {
        type: Number,
        default: null
    },
    sellType: {
        type: String,
        enum: ['auction', 'fixed'],
        default: 'auction',
        required: true
    },
    minIncrement: {
        type: Number,
        default: 5000
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
    // ===== Vehicle-Specific Fields (for Cars, RVs, etc.) =====
    vin: {
        type: String,
        trim: true,
        uppercase: true,
        sparse: true  // Allows null/undefined values, unique only when present
    },
    make: {
        type: String,
        trim: true
    },
    model: {
        type: String,
        trim: true
    },
    year: {
        type: Number,
        min: 1900,
        max: 2100
    },
    mileage: {
        type: Number,
        min: 0
    },
    fuelType: {
        type: String,
        enum: ['gasoline', 'diesel', 'electric', 'hybrid', 'other'],
        trim: true
    },
    transmission: {
        type: String,
        enum: ['automatic', 'manual', 'cvt', 'other'],
        trim: true
    },
    vehicleTitle: {
        type: String,
        enum: ['clean', 'salvage', 'rebuilt', 'other'],
        trim: true
    },
    // Vehicle History Report
    vehicleHistoryReport: {
        available: {
            type: Boolean,
            default: false
        },
        provider: {
            type: String,
            enum: ['AutoCheck', 'Carfax', 'Other', 'N/A'],
            default: 'N/A'
        },
        reportUrl: {
            type: String,
            trim: true
        },
        unavailableReasons: [{
            type: String
        }]
    },
    // ===== End Vehicle Fields =====

    // ===== Enhanced Item Specifics (flexible key-value pairs) =====
    // All category-specific fields (cars, real estate, electronics, etc.) are stored here.
    // The Category.fieldSchema defines what fields exist and how to display/filter them.
    itemSpecifics: {
        type: Map,
        of: String,
        default: new Map()
    },

    // ===== Rich Seller Description =====
    sellerDescription: {
        type: String,
        trim: true,
        default: ''
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
        required: false,
        default: Date.now
    },
    // Auction duration in days (only for auction type products)
    auctionDuration: {
        type: Number,
        required: false,
        default: null
    },
    // Auction end time (calculated: auctionStart + duration)
    bidDeadline: {
        type: Date,
        required: false
    },
    // Auction status: "scheduled", "active", or "ended"
    auctionStatus: {
        type: String,
        enum: ['scheduled', 'active', 'ended'],
        default: 'active'
    },
    // ===== End of Start System =====

    // ===== Authenticity Verification System (Mercari-style) =====
    verified: {
        type: Boolean,
        default: false
    },
    verification: {
        status: {
            type: String,
            enum: ['none', 'pending', 'approved', 'rejected'],
            default: 'none'
        },
        // Verification photos (specific angles required)
        photos: [{
            type: {
                type: String,
                enum: [
                    'front', 'back', 'side', 'top', 'bottom',
                    'logo', 'tag', 'serial', 'barcode', 'made-in-label',
                    'sole', 'insole', 'stitching', 'hardware',
                    'hallmark', 'clasp', 'engraving', 'authentication-card'
                ]
            },
            url: String,
            publicId: String,
            required: {
                type: Boolean,
                default: false
            }
        }],
        // Verification request details
        requestedAt: {
            type: Date
        },
        // Admin review
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        reviewedAt: {
            type: Date
        },
        reviewNotes: {
            type: String,
            trim: true
        },
        // Badge level
        badgeType: {
            type: String,
            enum: ['basic', 'premium', 'luxury'],
            default: 'basic'
        },
        // Certificate of authenticity
        certificateIssued: {
            type: Boolean,
            default: false
        },
        certificateNumber: {
            type: String,
            unique: true,
            sparse: true
        }
    },

    // ===== Delivery / Fulfillment =====
    deliveryStatus: {
        type: String,
        enum: ['pending', 'arranging', 'shipped', 'delivered'],
        default: 'pending'
    },
    deliveryInfo: {
        method:         { type: String, enum: ['meetup', 'courier', 'ubcab', 'mail', 'other'] },
        trackingNumber: { type: String, trim: true },
        address:        { type: String, trim: true },
        sellerNote:     { type: String, trim: true },
        shippedAt:      { type: Date },
        buyerNote:      { type: String, trim: true },
        deliveredAt:    { type: Date },
    },
    // ===== End Delivery =====

    sold: {
        type: Boolean,
        default: false
    },
    soldAt: {
        type: Date,
        default: null
    },
    soldTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    available: {
        type: Boolean,
        default: true
    },
    // View tracking
    views: {
        type: Number,
        default: 0
    },
    // Unique viewers (to prevent counting same user multiple times)
    uniqueViewers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
function arrayLimit(val) {
    return val.length <= 3;
}


// Pre-save hook: Handle status transitions and availability
productSchema.pre('save', function(next) {
    const now = new Date();


    // If already sold, don't override the status
    if (this.sold) {
        this.auctionStatus = 'ended';
        this.available = false;
        next();
        return;
    }


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
        this.soldAt = new Date();
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
    // Check if MongoDB connection is ready
    if (mongoose.connection.readyState !== 1) {
        return 0;
    }

    const now = new Date();

    try {
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
        }

        return result.modifiedCount;
    } catch (error) {
        return 0;
    }
};

// Static method: Mark expired auctions as ended
productSchema.statics.updateExpiredAuctions = async function() {
    // Check if MongoDB connection is ready
    if (mongoose.connection.readyState !== 1) {
        return 0;
    }

    const now = new Date();

    try {
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
        }

        return result.modifiedCount;
    } catch (error) {
        return 0;
    }
};

// ===== Database Indexes for Performance =====
// Compound index for home page queries (available + sold + status + date sorting)
productSchema.index({ available: 1, sold: 1, auctionStatus: 1, createdAt: -1 });

// Compound index for category browsing
productSchema.index({ category: 1, auctionStatus: 1, available: 1 });

// Compound index for user's auction management (my auctions)
productSchema.index({ user: 1, auctionStatus: 1 });

// Index for finding auctions user is bidding on
productSchema.index({ highestBidder: 1, auctionStatus: 1 });

// Index for auction scheduler to find auctions to activate/end
productSchema.index({ auctionStatus: 1, auctionStart: 1 });
productSchema.index({ auctionStatus: 1, bidDeadline: 1 });

// Text index for search functionality (title + description)
productSchema.index({ title: 'text', description: 'text' });

// Index on slug for product detail pages (unique)
productSchema.index({ slug: 1 }, { unique: true });

module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);
