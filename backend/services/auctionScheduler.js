/**
 * Auction Scheduler Service
 *
 * This service automatically:
 * 1. Activates scheduled auctions when their start time arrives
 * 2. Marks active auctions as ended when their deadline passes
 *
 * Runs every minute to check for status updates
 */

const cron = require('node-cron');
const mongoose = require('mongoose');
const Product = require('../models/product');
const Deposit = require('../models/Deposit');
const User = require('../models/User');

// Flag to track if scheduler is running
let isSchedulerRunning = false;

/**
 * Check if MongoDB connection is ready
 */
const isConnectionReady = () => {
    return mongoose.connection.readyState === 1; // 1 = connected
};

/**
 * Start the auction scheduler
 * Runs every minute: "* * * * *"
 */
const startAuctionScheduler = () => {
    if (isSchedulerRunning) {
        return;
    }


    // Schedule task to run every minute
    cron.schedule('* * * * *', async () => {
        try {
            // Check if MongoDB connection is ready
            if (!isConnectionReady()) {
                return;
            }

            const now = new Date();

            // Activate scheduled auctions whose start time has arrived
            const activatedCount = await Product.activateScheduledAuctions();

            // Mark expired auctions as ended
            const expiredCount = await Product.updateExpiredAuctions();

            // Release held deposits for ended auctions
            const endedDeposits = await Deposit.find({ status: 'held' })
                .populate('product', 'auctionStatus soldTo');
            let releasedCount = 0;
            for (const deposit of endedDeposits) {
                if (deposit.product?.auctionStatus === 'ended') {
                    await User.findByIdAndUpdate(deposit.user, { $inc: { balance: deposit.amount } });
                    const isWinner = deposit.product.soldTo &&
                        deposit.product.soldTo.toString() === deposit.user.toString();
                    deposit.status = 'returned';
                    deposit.releasedAt = new Date();
                    deposit.reason = isWinner ? 'Auction won' : 'Auction ended';
                    await deposit.save();
                    releasedCount++;
                }
            }

            if (activatedCount > 0 || expiredCount > 0 || releasedCount > 0) {
            }

        } catch (error) {
            // Don't crash the scheduler on errors, just log them
            if (error.message && error.message.includes('buffering timed out')) {
            } else {
            }
        }
    });

    isSchedulerRunning = true;
};

/**
 * Manually trigger auction status updates
 * Useful for testing or immediate execution
 */
const updateAuctionStatuses = async () => {
    try {
        // Check if MongoDB connection is ready
        if (!isConnectionReady()) {
            return {
                success: false,
                error: 'MongoDB connection not ready'
            };
        }


        const activatedCount = await Product.activateScheduledAuctions();
        const expiredCount = await Product.updateExpiredAuctions();

        return {
            success: true,
            activated: activatedCount,
            expired: expiredCount
        };
    } catch (error) {
        return {
            success: false,
            error: error.message || 'Unknown error'
        };
    }
};

module.exports = {
    startAuctionScheduler,
    updateAuctionStatuses
};
