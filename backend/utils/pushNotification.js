const { getMessaging } = require('../config/firebase');
const User = require('../models/User');

/**
 * Send push notification to a single user
 * @param {String} userId - User ID to send notification to
 * @param {Object} notification - Notification object
 * @param {String} notification.title - Notification title
 * @param {String} notification.body - Notification body
 * @param {String} notification.image - Optional image URL
 * @param {String} notification.type - Notification type
 * @param {String} notification.productId - Optional product ID
 * @param {String} notification.actionUrl - Optional action URL
 * @param {Object} notification.data - Optional additional data
 */
async function sendPushNotification(userId, notification) {
    const messaging = getMessaging();

    if (!messaging) {
        console.log('Firebase not initialized. Skipping push notification.');
        return { success: false, reason: 'firebase_not_initialized' };
    }

    try {
        const user = await User.findById(userId);

        if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
            console.log(`No FCM tokens found for user ${userId}`);
            return { success: false, reason: 'no_tokens' };
        }

        const message = {
            notification: {
                title: notification.title,
                body: notification.body
            },
            data: {
                type: notification.type || 'general',
                productId: notification.productId?.toString() || '',
                actionUrl: notification.actionUrl || '',
                ...(notification.data || {})
            },
            tokens: user.fcmTokens
        };

        // Add image if provided
        if (notification.image) {
            message.notification.imageUrl = notification.image;
        }

        const response = await messaging.sendEachForMulticast(message);

        console.log(`Push notification sent: ${response.successCount} successful, ${response.failureCount} failed`);

        // Remove invalid tokens
        if (response.failureCount > 0) {
            const tokensToRemove = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    tokensToRemove.push(user.fcmTokens[idx]);
                    console.log(`Removing invalid token: ${resp.error.code}`);
                }
            });

            if (tokensToRemove.length > 0) {
                await User.updateOne(
                    { _id: userId },
                    { $pull: { fcmTokens: { $in: tokensToRemove } } }
                );
            }
        }

        return {
            success: response.successCount > 0,
            successCount: response.successCount,
            failureCount: response.failureCount
        };

    } catch (error) {
        console.error('Failed to send push notification:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Send push notification to multiple users
 * @param {Array<String>} userIds - Array of user IDs
 * @param {Object} notification - Notification object (same as sendPushNotification)
 */
async function sendBulkPushNotifications(userIds, notification) {
    const results = await Promise.allSettled(
        userIds.map(userId => sendPushNotification(userId, notification))
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    console.log(`Bulk push notifications: ${successful} successful, ${failed} failed`);

    return {
        total: results.length,
        successful,
        failed
    };
}

/**
 * Send notification to product owner
 * @param {Object} product - Product object with user field
 * @param {Object} notification - Notification object
 */
async function notifyProductOwner(product, notification) {
    const ownerId = product.user?._id || product.user;
    return await sendPushNotification(ownerId, notification);
}

/**
 * Send notification to all users who liked a product
 * @param {String} productId - Product ID
 * @param {Object} notification - Notification object
 */
async function notifyProductLikers(productId, notification) {
    const Like = require('../models/Like');

    const likes = await Like.find({ product: productId }).select('user');
    const userIds = likes.map(like => like.user);

    if (userIds.length === 0) {
        return { success: false, reason: 'no_likers' };
    }

    return await sendBulkPushNotifications(userIds, notification);
}

module.exports = {
    sendPushNotification,
    sendBulkPushNotifications,
    notifyProductOwner,
    notifyProductLikers
};
