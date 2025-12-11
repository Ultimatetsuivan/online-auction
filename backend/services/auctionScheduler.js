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
        console.log('[Auction Scheduler] Already running');
        return;
    }

    console.log('[Auction Scheduler] Starting...');

    // Schedule task to run every minute
    cron.schedule('* * * * *', async () => {
        try {
            // Check if MongoDB connection is ready
            if (!isConnectionReady()) {
                console.warn('[Auction Scheduler] MongoDB connection not ready, skipping this run');
                return;
            }

            const now = new Date();
            console.log(`[Auction Scheduler] Running check at ${now.toISOString()}`);

            // Activate scheduled auctions whose start time has arrived
            const activatedCount = await Product.activateScheduledAuctions();

            // Mark expired auctions as ended
            const expiredCount = await Product.updateExpiredAuctions();

            if (activatedCount > 0 || expiredCount > 0) {
                console.log(`[Auction Scheduler] Summary: ${activatedCount} activated, ${expiredCount} expired`);
            }

        } catch (error) {
            // Don't crash the scheduler on errors, just log them
            if (error.message && error.message.includes('buffering timed out')) {
                console.warn('[Auction Scheduler] MongoDB connection timeout - will retry on next run');
            } else {
                console.error('[Auction Scheduler] Error:', error.message || error);
            }
        }
    });

    isSchedulerRunning = true;
    console.log('[Auction Scheduler] Started successfully - running every minute');
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

        console.log('[Auction Scheduler] Manual update triggered');

        const activatedCount = await Product.activateScheduledAuctions();
        const expiredCount = await Product.updateExpiredAuctions();

        return {
            success: true,
            activated: activatedCount,
            expired: expiredCount
        };
    } catch (error) {
        console.error('[Auction Scheduler] Manual update error:', error.message || error);
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
