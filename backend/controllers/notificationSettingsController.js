const NotificationSettings = require('../models/NotificationSettings');

// Get user's notification settings
exports.getNotificationSettings = async (req, res) => {
    try {
        const userId = req.user._id;

        let settings = await NotificationSettings.findOne({ user: userId });

        // If user doesn't have settings yet, create default settings
        if (!settings) {
            settings = await NotificationSettings.create({ user: userId });
        }

        res.json({
            success: true,
            settings
        });

    } catch (error) {
        console.error('Get notification settings error:', error);
        res.status(500).json({
            error: 'Алдаа гарлаа',
            details: error.message
        });
    }
};

// Update user's notification settings
exports.updateNotificationSettings = async (req, res) => {
    try {
        const userId = req.user._id;
        const updates = req.body;

        // List of allowed fields to update
        const allowedUpdates = [
            'outbidAlerts',
            'winningAlerts',
            'newBidAlerts',
            'auctionStartingSoon',
            'auctionEndingSoon',
            'auctionEndingSoonHours',
            'priceDropAlerts',
            'buyNowChangeAlerts',
            'watchlistAlerts',
            'depositAlerts',
            'withdrawalAlerts',
            'transactionAlerts',
            'productSoldAlerts',
            'newFollowerAlerts',
            'systemAlerts',
            'emailNotifications',
            'pushNotifications',
            'smsNotifications'
        ];

        // Filter out invalid fields
        const validUpdates = {};
        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key)) {
                validUpdates[key] = updates[key];
            }
        });

        // Validate auctionEndingSoonHours
        if (validUpdates.auctionEndingSoonHours !== undefined) {
            const hours = parseInt(validUpdates.auctionEndingSoonHours);
            if (isNaN(hours) || hours < 1 || hours > 168) {
                return res.status(400).json({
                    error: 'auctionEndingSoonHours нь 1-168 хооронд байх ёстой'
                });
            }
            validUpdates.auctionEndingSoonHours = hours;
        }

        let settings = await NotificationSettings.findOne({ user: userId });

        if (!settings) {
            // Create new settings with updates
            settings = await NotificationSettings.create({
                user: userId,
                ...validUpdates
            });
        } else {
            // Update existing settings
            Object.keys(validUpdates).forEach(key => {
                settings[key] = validUpdates[key];
            });
            await settings.save();
        }

        res.json({
            success: true,
            settings,
            message: 'Мэдэгдлийн тохиргоо шинэчлэгдлээ'
        });

    } catch (error) {
        console.error('Update notification settings error:', error);
        res.status(500).json({
            error: 'Алдаа гарлаа',
            details: error.message
        });
    }
};

// Reset notification settings to default
exports.resetNotificationSettings = async (req, res) => {
    try {
        const userId = req.user._id;

        await NotificationSettings.findOneAndDelete({ user: userId });

        const settings = await NotificationSettings.create({ user: userId });

        res.json({
            success: true,
            settings,
            message: 'Мэдэгдлийн тохиргоо анхны байдалд орлоо'
        });

    } catch (error) {
        console.error('Reset notification settings error:', error);
        res.status(500).json({
            error: 'Алдаа гарлаа',
            details: error.message
        });
    }
};
