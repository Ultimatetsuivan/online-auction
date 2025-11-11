/**
 * Calculate user's trust score based on their activity
 * @param {Object} user - User object
 * @returns {Number} Trust score (0-100)
 */
function calculateTrustScore(user) {
    const { completedDeals, cancelledBids } = user;

    // New users start with 0 score
    if (completedDeals === 0 && cancelledBids === 0) {
        return 0;
    }

    // If user only has cancellations, score is 0
    if (completedDeals === 0) {
        return 0;
    }

    // Calculate success rate
    const totalActivity = completedDeals + cancelledBids;
    const successRate = completedDeals / totalActivity;

    // Base score from success rate (0-80 points)
    let score = successRate * 80;

    // Bonus points for volume (0-20 points)
    // More deals = higher trust, capped at 20 bonus points
    const volumeBonus = Math.min(20, completedDeals * 2);
    score += volumeBonus;

    // Ensure score is between 0 and 100
    return Math.min(100, Math.max(0, Math.floor(score)));
}

/**
 * Check if user can place a deposit
 * @param {Object} user - User object
 * @returns {Boolean} True if user can place deposit
 */
function canPlaceDeposit(user) {
    const minTrustScore = parseInt(process.env.MIN_TRUST_SCORE_FOR_DEPOSIT) || 70;
    return user.trustScore >= minTrustScore;
}

/**
 * Update user's trust score after an action
 * @param {String} userId - User ID
 * @param {String} action - Action type ('completed' or 'cancelled')
 */
async function updateTrustScore(userId, action) {
    const User = require('../models/User');

    const updateField = action === 'completed' ? 'completedDeals' : 'cancelledBids';

    const user = await User.findByIdAndUpdate(
        userId,
        { $inc: { [updateField]: 1 } },
        { new: true }
    );

    if (!user) {
        throw new Error('User not found');
    }

    const newTrustScore = calculateTrustScore(user);

    await User.findByIdAndUpdate(userId, { trustScore: newTrustScore });

    return newTrustScore;
}

/**
 * Get trust score level (text description)
 * @param {Number} score - Trust score
 * @returns {String} Level description
 */
function getTrustLevel(score) {
    if (score >= 90) return 'Маш сайн';
    if (score >= 70) return 'Сайн';
    if (score >= 50) return 'Дунд';
    if (score >= 30) return 'Доогуур';
    return 'Шинэ';
}

module.exports = {
    calculateTrustScore,
    canPlaceDeposit,
    updateTrustScore,
    getTrustLevel
};
