/**
 * Notification Service
 * Centralizes all notification logic (push notifications + in-app notifications)
 */

const { sendPushNotification } = require('../utils/pushNotification');
const { createNotification } = require('../controllers/notificationController');
const logger = require('../utils/logger');

/**
 * Send notification to a single user (push + in-app)
 * @param {string} userId - User ID to notify
 * @param {Object} notification - Notification data
 * @returns {Promise<Object>} - Result
 */
async function notify(userId, notification) {
    const {
        title,
        body,
        message, // For in-app notification
        type,
        productId,
        actionUrl,
        data = {}
    } = notification;

    try {
        // Send both push and in-app notifications in parallel
        await Promise.all([
            // Push notification (Firebase FCM)
            sendPushNotification(userId, {
                title,
                body: body || message,
                type,
                productId,
                actionUrl,
                ...data
            }).catch(err => {
                // Don't fail if push notification fails
                logger.warn('Push notification failed', {
                    userId,
                    error: err.message
                });
            }),

            // In-app notification
            createNotification(userId, {
                type,
                title,
                message: message || body,
                productId,
                actionUrl,
                ...data
            }).catch(err => {
                // Don't fail if in-app notification fails
                logger.warn('In-app notification failed', {
                    userId,
                    error: err.message
                });
            })
        ]);

        logger.info('Notification sent', {
            userId,
            type,
            title
        });

        return { success: true };

    } catch (error) {
        logger.error('Notification service error', error);
        // Don't throw - notifications shouldn't block main flow
        return { success: false, error: error.message };
    }
}

/**
 * Send notification to multiple users
 * @param {Array<string>} userIds - Array of user IDs
 * @param {Object} notification - Notification data
 * @returns {Promise<Object>} - Result
 */
async function notifyMultiple(userIds, notification) {
    if (!userIds || userIds.length === 0) {
        return { success: true, count: 0 };
    }

    try {
        // Send to all users in parallel
        const results = await Promise.allSettled(
            userIds.map(userId => notify(userId, notification))
        );

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failureCount = results.filter(r => r.status === 'rejected').length;

        logger.info('Bulk notification sent', {
            totalUsers: userIds.length,
            successCount,
            failureCount,
            type: notification.type
        });

        return {
            success: true,
            totalUsers: userIds.length,
            successCount,
            failureCount
        };

    } catch (error) {
        logger.error('Bulk notification error', error);
        return { success: false, error: error.message };
    }
}

/**
 * Notify about outbid event
 * @param {string} userId - Previous highest bidder
 * @param {Object} product - Product object
 * @param {number} newBidAmount - New bid amount
 */
async function notifyOutbid(userId, product, newBidAmount) {
    return notify(userId, {
        type: 'outbid',
        title: 'Таны санал давж орлоо',
        message: `"${product.title}" бараанд ${newBidAmount.toLocaleString()}₮-ийн санал ирсэн байна`,
        body: `"${product.title}" бараанд ${newBidAmount.toLocaleString()}₮-ийн санал ирсэн байна`,
        productId: product._id,
        actionUrl: `/products/${product._id || product.slug}`
    });
}

/**
 * Notify about won auction
 * @param {string} userId - Winner user ID
 * @param {Object} product - Product object
 * @param {number} winningBid - Winning bid amount
 */
async function notifyWonAuction(userId, product, winningBid) {
    return notify(userId, {
        type: 'won_auction',
        title: 'Баяр хүргэе!',
        message: `Та "${product.title}"-г ${winningBid.toLocaleString()}₮-өөр худалдан авлаа`,
        body: `Та "${product.title}"-г ${winningBid.toLocaleString()}₮-өөр худалдан авлаа`,
        productId: product._id,
        actionUrl: `/products/${product._id || product.slug}`
    });
}

/**
 * Notify seller about product sold
 * @param {string} userId - Seller user ID
 * @param {Object} product - Product object
 * @param {number} soldPrice - Sold price
 */
async function notifyProductSold(userId, product, soldPrice) {
    return notify(userId, {
        type: 'sold',
        title: 'Бараа зарагдлаа',
        message: `"${product.title}" ${soldPrice.toLocaleString()}₮-өөр зарагдлаа`,
        body: `"${product.title}" ${soldPrice.toLocaleString()}₮-өөр зарагдлаа`,
        productId: product._id,
        actionUrl: `/products/${product._id || product.slug}`
    });
}

/**
 * Notify about auction ending soon
 * @param {string} userId - User ID
 * @param {Object} product - Product object
 * @param {number} hoursRemaining - Hours until auction ends
 */
async function notifyAuctionEndingSoon(userId, product, hoursRemaining) {
    return notify(userId, {
        type: 'auction_ending',
        title: 'Аукшин удахгүй дуусна',
        message: `"${product.title}" аукшин ${hoursRemaining} цагийн дараа дуусна`,
        body: `"${product.title}" аукшин ${hoursRemaining} цагийн дараа дуусна`,
        productId: product._id,
        actionUrl: `/products/${product._id || product.slug}`
    });
}

/**
 * Notify about payment success
 * @param {string} userId - User ID
 * @param {number} amount - Payment amount
 */
async function notifyPaymentSuccess(userId, amount) {
    return notify(userId, {
        type: 'payment_success',
        title: 'Төлбөр амжилттай',
        message: `${amount.toLocaleString()}₮ дансанд орлоо`,
        body: `${amount.toLocaleString()}₮ дансанд орлоо`,
        actionUrl: '/profile'
    });
}

/**
 * Notify about deposit return
 * @param {string} userId - User ID
 * @param {number} amount - Deposit amount
 * @param {string} productTitle - Product title
 */
async function notifyDepositReturn(userId, amount, productTitle) {
    return notify(userId, {
        type: 'deposit_return',
        title: 'Барьцаа буцаан олголоо',
        message: `"${productTitle}" барааны ${amount.toLocaleString()}₮ барьцаа таны дансанд буцаан орлоо`,
        body: `"${productTitle}" барааны ${amount.toLocaleString()}₮ барьцаа таны дансанд буцаан орлоо`,
        actionUrl: '/profile'
    });
}

module.exports = {
    notify,
    notifyMultiple,
    notifyOutbid,
    notifyWonAuction,
    notifyProductSold,
    notifyAuctionEndingSoon,
    notifyPaymentSuccess,
    notifyDepositReturn
};
