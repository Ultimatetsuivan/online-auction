const Notification = require('../models/Notification');

// Get user's notifications
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const unreadOnly = req.query.unreadOnly === 'true';

        const query = { user: userId };
        if (unreadOnly) {
            query.read = false;
        }

        const notifications = await Notification.find(query)
            .populate('product', 'title slug images price currentBid')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Notification.countDocuments(query);
        const unreadCount = await Notification.countDocuments({ user: userId, read: false });

        res.json({
            success: true,
            notifications,
            unreadCount,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            error: 'Мэдэгдэл татахад алдаа гарлаа',
            details: error.message
        });
    }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, user: userId },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                error: 'Мэдэгдэл олдсонгүй'
            });
        }

        res.json({
            success: true,
            notification
        });

    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            error: 'Алдаа гарлаа',
            details: error.message
        });
    }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user._id;

        await Notification.updateMany(
            { user: userId, read: false },
            { read: true }
        );

        res.json({
            success: true,
            message: 'Бүх мэдэгдлийг уншсан гэж тэмдэглэлээ'
        });

    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({
            error: 'Алдаа гарлаа',
            details: error.message
        });
    }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const notification = await Notification.findOneAndDelete({
            _id: id,
            user: userId
        });

        if (!notification) {
            return res.status(404).json({
                error: 'Мэдэгдэл олдсонгүй'
            });
        }

        res.json({
            success: true,
            message: 'Мэдэгдэл устгагдлаа'
        });

    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            error: 'Алдаа гарлаа',
            details: error.message
        });
    }
};

// Delete all read notifications
exports.clearReadNotifications = async (req, res) => {
    try {
        const userId = req.user._id;

        const result = await Notification.deleteMany({
            user: userId,
            read: true
        });

        res.json({
            success: true,
            message: `${result.deletedCount} мэдэгдэл устгагдлаа`
        });

    } catch (error) {
        console.error('Clear notifications error:', error);
        res.status(500).json({
            error: 'Алдаа гарлаа',
            details: error.message
        });
    }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;

        const count = await Notification.countDocuments({
            user: userId,
            read: false
        });

        res.json({
            success: true,
            count
        });

    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            error: 'Алдаа гарлаа',
            details: error.message
        });
    }
};

/**
 * Helper function to create notification (used by other controllers)
 */
exports.createNotification = async (userId, data) => {
    try {
        const notification = await Notification.create({
            user: userId,
            type: data.type,
            product: data.productId,
            title: data.title,
            message: data.message,
            actionUrl: data.actionUrl,
            metadata: data.metadata
        });

        return notification;
    } catch (error) {
        console.error('Create notification error:', error);
        throw error;
    }
};
