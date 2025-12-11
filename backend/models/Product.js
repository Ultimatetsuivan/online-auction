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
    minIncrement: {
        type: Number,
        default: 1
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

    console.log('[PRE-SAVE HOOK] Product:', this.title, 'Sold:', this.sold);

    // If already sold, don't override the status
    if (this.sold) {
        console.log('[PRE-SAVE HOOK] Product is sold, setting status to ended');
        this.auctionStatus = 'ended';
        this.available = false;
        next();
        return;
    }

    console.log('[PRE-SAVE HOOK] Product not sold, checking time-based status');

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
    // Check if MongoDB connection is ready
    if (mongoose.connection.readyState !== 1) {
        console.warn('[Product Model] MongoDB connection not ready for activateScheduledAuctions');
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
            console.log(`[Auction Scheduler] Activated ${result.modifiedCount} scheduled auction(s)`);
        }

        return result.modifiedCount;
    } catch (error) {
        console.error('[Product Model] Error in activateScheduledAuctions:', error.message || error);
        return 0;
    }
};

// Static method: Mark expired auctions as ended
productSchema.statics.updateExpiredAuctions = async function() {
    // Check if MongoDB connection is ready
    if (mongoose.connection.readyState !== 1) {
        console.warn('[Product Model] MongoDB connection not ready for updateExpiredAuctions');
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
            console.log(`[Auction Scheduler] Ended ${result.modifiedCount} expired auction(s)`);
        }

        return result.modifiedCount;
    } catch (error) {
        console.error('[Product Model] Error in updateExpiredAuctions:', error.message || error);
        return 0;
    }
};

module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);
