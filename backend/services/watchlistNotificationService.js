const Watchlist = require('../models/Watchlist');
const NotificationSettings = require('../models/NotificationSettings');
const Product = require('../models/Product');
const { createNotification } = require('../controllers/notificationController');
const { sendPushNotification } = require('../utils/pushNotification');

/**
 * Notify users when a watched product is starting soon
 * @param {String} productId - The product ID
 */
const notifyWatchlistAuctionStarting = async (productId) => {
    try {
        const product = await Product.findById(productId).populate('user', 'name');
        if (!product) return;

        // Find all users watching this product who want start notifications
        const watchlistItems = await Watchlist.find({
            product: productId,
            notifyOnStart: true
        }).populate('user');

        const primaryImage = product.images?.find?.(img => img.isPrimary)?.url || product.images?.[0]?.url || null;

        for (const item of watchlistItems) {
            try {
                // Check user's notification settings
                const settings = await NotificationSettings.findOne({ user: item.user._id });

                if (settings && !settings.watchlistAlerts) continue;
                if (settings && !settings.auctionStartingSoon) continue;

                // Create notification
                await createNotification(item.user._id, {
                    type: 'expiring_soon',
                    product: productId,
                    title: 'Watchlist аукцион эхэллээ',
                    message: `"${product.title}" аукцион эхэллээ. Одоо бид тавих боломжтой!`,
                    actionUrl: `/products/${productId}`
                });

                // Send push notification
                if (settings && settings.pushNotifications) {
                    await sendPushNotification(item.user._id, {
                        title: 'Watchlist аукцион эхэллээ',
                        body: `"${product.title}" эхэллээ`,
                        type: 'expiring_soon',
                        productId: productId,
                        actionUrl: `/products/${productId}`,
                        image: primaryImage
                    });
                }
            } catch (error) {
                console.error(`Error notifying user ${item.user._id}:`, error);
            }
        }

        console.log(`Notified ${watchlistItems.length} users about auction starting: ${productId}`);
    } catch (error) {
        console.error('Error in notifyWatchlistAuctionStarting:', error);
    }
};

/**
 * Notify users when a watched product is ending soon
 * @param {String} productId - The product ID
 */
const notifyWatchlistEndingSoon = async (productId) => {
    try {
        const product = await Product.findById(productId).populate('user', 'name');
        if (!product) return;

        // Find all users watching this product who want ending soon notifications
        const watchlistItems = await Watchlist.find({
            product: productId,
            notifyOnEndingSoon: true
        }).populate('user');

        const primaryImage = product.images?.find?.(img => img.isPrimary)?.url || product.images?.[0]?.url || null;
        const hoursLeft = Math.round((new Date(product.bidDeadline) - new Date()) / (1000 * 60 * 60));

        for (const item of watchlistItems) {
            try {
                // Check user's notification settings
                const settings = await NotificationSettings.findOne({ user: item.user._id });

                if (settings && !settings.watchlistAlerts) continue;
                if (settings && !settings.auctionEndingSoon) continue;

                // Create notification
                await createNotification(item.user._id, {
                    type: 'expiring_soon',
                    product: productId,
                    title: 'Watchlist аукцион дуусахад хэдхэн цаг үлдлээ',
                    message: `"${product.title}" ${hoursLeft} цагийн дараа дуусна. Бид тавих цаг нь боллоо!`,
                    actionUrl: `/products/${productId}`
                });

                // Send push notification
                if (settings && settings.pushNotifications) {
                    await sendPushNotification(item.user._id, {
                        title: 'Аукцион дуусахад ойртлоо',
                        body: `"${product.title}" - ${hoursLeft} цаг үлдлээ`,
                        type: 'expiring_soon',
                        productId: productId,
                        actionUrl: `/products/${productId}`,
                        image: primaryImage
                    });
                }
            } catch (error) {
                console.error(`Error notifying user ${item.user._id}:`, error);
            }
        }

        console.log(`Notified ${watchlistItems.length} users about auction ending soon: ${productId}`);
    } catch (error) {
        console.error('Error in notifyWatchlistEndingSoon:', error);
    }
};

/**
 * Notify users when a watched product's price changes
 * @param {String} productId - The product ID
 * @param {Number} oldPrice - The old price
 * @param {Number} newPrice - The new price
 */
const notifyWatchlistPriceChange = async (productId, oldPrice, newPrice) => {
    try {
        const product = await Product.findById(productId).populate('user', 'name');
        if (!product) return;

        // Only notify if price dropped
        if (newPrice >= oldPrice) return;

        // Find all users watching this product who want price change notifications
        const watchlistItems = await Watchlist.find({
            product: productId,
            notifyOnPriceChange: true
        }).populate('user');

        const primaryImage = product.images?.find?.(img => img.isPrimary)?.url || product.images?.[0]?.url || null;
        const priceDrop = oldPrice - newPrice;
        const percentDrop = Math.round((priceDrop / oldPrice) * 100);

        for (const item of watchlistItems) {
            try {
                // Check user's notification settings
                const settings = await NotificationSettings.findOne({ user: item.user._id });

                if (settings && !settings.watchlistAlerts) continue;
                if (settings && !settings.priceDropAlerts) continue;

                // Create notification
                await createNotification(item.user._id, {
                    type: 'price_drop',
                    product: productId,
                    title: 'Watchlist үнэ буурлаа',
                    message: `"${product.title}" үнэ ${percentDrop}% буурч ${newPrice.toLocaleString()}₮ боллоо!`,
                    actionUrl: `/products/${productId}`,
                    metadata: {
                        oldPrice,
                        newPrice,
                        priceDrop,
                        percentDrop
                    }
                });

                // Send push notification
                if (settings && settings.pushNotifications) {
                    await sendPushNotification(item.user._id, {
                        title: 'Үнэ буурлаа!',
                        body: `"${product.title}" - ${percentDrop}% хямдралтай`,
                        type: 'price_drop',
                        productId: productId,
                        actionUrl: `/products/${productId}`,
                        image: primaryImage
                    });
                }
            } catch (error) {
                console.error(`Error notifying user ${item.user._id}:`, error);
            }
        }

        console.log(`Notified ${watchlistItems.length} users about price drop: ${productId}`);
    } catch (error) {
        console.error('Error in notifyWatchlistPriceChange:', error);
    }
};

/**
 * Notify users when a watched product's buy now price changes
 * @param {String} productId - The product ID
 * @param {Number} oldPrice - The old buy now price
 * @param {Number} newPrice - The new buy now price
 */
const notifyWatchlistBuyNowChange = async (productId, oldPrice, newPrice) => {
    try {
        const product = await Product.findById(productId).populate('user', 'name');
        if (!product) return;

        // Only notify if price dropped
        if (newPrice >= oldPrice) return;

        // Find all users watching this product who want price change notifications
        const watchlistItems = await Watchlist.find({
            product: productId,
            notifyOnPriceChange: true
        }).populate('user');

        const primaryImage = product.images?.find?.(img => img.isPrimary)?.url || product.images?.[0]?.url || null;
        const priceDrop = oldPrice - newPrice;
        const percentDrop = Math.round((priceDrop / oldPrice) * 100);

        for (const item of watchlistItems) {
            try {
                // Check user's notification settings
                const settings = await NotificationSettings.findOne({ user: item.user._id });

                if (settings && !settings.watchlistAlerts) continue;
                if (settings && !settings.buyNowChangeAlerts) continue;

                // Create notification
                await createNotification(item.user._id, {
                    type: 'price_drop',
                    product: productId,
                    title: 'Buy Now үнэ буурлаа',
                    message: `"${product.title}" Buy Now үнэ ${percentDrop}% буурч ${newPrice.toLocaleString()}₮ боллоо!`,
                    actionUrl: `/products/${productId}`,
                    metadata: {
                        oldPrice,
                        newPrice,
                        priceDrop,
                        percentDrop
                    }
                });

                // Send push notification
                if (settings && settings.pushNotifications) {
                    await sendPushNotification(item.user._id, {
                        title: 'Buy Now үнэ буурлаа!',
                        body: `"${product.title}" - ${percentDrop}% хямдралтай`,
                        type: 'price_drop',
                        productId: productId,
                        actionUrl: `/products/${productId}`,
                        image: primaryImage
                    });
                }
            } catch (error) {
                console.error(`Error notifying user ${item.user._id}:`, error);
            }
        }

        console.log(`Notified ${watchlistItems.length} users about buy now price drop: ${productId}`);
    } catch (error) {
        console.error('Error in notifyWatchlistBuyNowChange:', error);
    }
};

module.exports = {
    notifyWatchlistAuctionStarting,
    notifyWatchlistEndingSoon,
    notifyWatchlistPriceChange,
    notifyWatchlistBuyNowChange
};
