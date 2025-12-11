const mongoose = require("mongoose");

const notificationSettingsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    // Bidding alerts
    outbidAlerts: {
        type: Boolean,
        default: true
    },
    winningAlerts: {
        type: Boolean,
        default: true
    },
    newBidAlerts: {
        type: Boolean,
        default: true
    },
    // Auction timing alerts
    auctionStartingSoon: {
        type: Boolean,
        default: true
    },
    auctionEndingSoon: {
        type: Boolean,
        default: true
    },
    auctionEndingSoonHours: {
        type: Number,
        default: 24, // Notify when auction ends in X hours
        min: 1,
        max: 168 // Max 7 days
    },
    // Price and product alerts
    priceDropAlerts: {
        type: Boolean,
        default: true
    },
    buyNowChangeAlerts: {
        type: Boolean,
        default: false
    },
    watchlistAlerts: {
        type: Boolean,
        default: true
    },
    // Transaction alerts
    depositAlerts: {
        type: Boolean,
        default: true
    },
    withdrawalAlerts: {
        type: Boolean,
        default: true
    },
    transactionAlerts: {
        type: Boolean,
        default: true
    },
    // Selling alerts
    productSoldAlerts: {
        type: Boolean,
        default: true
    },
    newFollowerAlerts: {
        type: Boolean,
        default: true
    },
    // System alerts
    systemAlerts: {
        type: Boolean,
        default: true
    },
    // Notification channels
    emailNotifications: {
        type: Boolean,
        default: true
    },
    pushNotifications: {
        type: Boolean,
        default: true
    },
    smsNotifications: {
        type: Boolean,
        default: false
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Update the updatedAt timestamp before saving
notificationSettingsSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const NotificationSettings = mongoose.model("NotificationSettings", notificationSettingsSchema);
module.exports = NotificationSettings;
