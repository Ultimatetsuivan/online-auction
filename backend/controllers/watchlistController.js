const Watchlist = require('../models/Watchlist');
const Product = require('../models/Product');

// Add product to watchlist
exports.addToWatchlist = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user._id;
        const { notifyOnStart, notifyOnEndingSoon, notifyOnPriceChange } = req.body;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                error: 'Бүтээгдэхүүн олдсонгүй'
            });
        }

        // Check if already in watchlist
        const existingWatch = await Watchlist.findOne({ user: userId, product: productId });

        if (existingWatch) {
            // Update notification preferences
            existingWatch.notifyOnStart = notifyOnStart !== undefined ? notifyOnStart : existingWatch.notifyOnStart;
            existingWatch.notifyOnEndingSoon = notifyOnEndingSoon !== undefined ? notifyOnEndingSoon : existingWatch.notifyOnEndingSoon;
            existingWatch.notifyOnPriceChange = notifyOnPriceChange !== undefined ? notifyOnPriceChange : existingWatch.notifyOnPriceChange;

            await existingWatch.save();

            return res.json({
                success: true,
                watchlist: existingWatch,
                message: 'Watchlist тохиргоо шинэчлэгдлээ'
            });
        }

        // Add to watchlist
        const watchlist = await Watchlist.create({
            user: userId,
            product: productId,
            notifyOnStart: notifyOnStart !== undefined ? notifyOnStart : true,
            notifyOnEndingSoon: notifyOnEndingSoon !== undefined ? notifyOnEndingSoon : true,
            notifyOnPriceChange: notifyOnPriceChange !== undefined ? notifyOnPriceChange : true
        });

        res.status(201).json({
            success: true,
            watchlist,
            message: 'Watchlist-д нэмэгдлээ'
        });

    } catch (error) {
        console.error('Add to watchlist error:', error);
        res.status(500).json({
            error: 'Алдаа гарлаа',
            details: error.message
        });
    }
};

// Remove product from watchlist
exports.removeFromWatchlist = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user._id;

        const watchlist = await Watchlist.findOneAndDelete({
            user: userId,
            product: productId
        });

        if (!watchlist) {
            return res.status(404).json({
                error: 'Watchlist-д олдсонгүй'
            });
        }

        res.json({
            success: true,
            message: 'Watchlist-аас хасагдлаа'
        });

    } catch (error) {
        console.error('Remove from watchlist error:', error);
        res.status(500).json({
            error: 'Алдаа гарлаа',
            details: error.message
        });
    }
};

// Get user's watchlist
exports.getMyWatchlist = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const watchlist = await Watchlist.find({ user: userId })
            .populate({
                path: 'product',
                select: 'title slug description images price currentBid bidDeadline sold auctionStartTime',
                populate: {
                    path: 'user',
                    select: 'name photo'
                }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Watchlist.countDocuments({ user: userId });

        // Filter out watchlist items where product was deleted
        const validWatchlist = watchlist.filter(item => item.product !== null);

        res.json({
            success: true,
            watchlist: validWatchlist,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get watchlist error:', error);
        res.status(500).json({
            error: 'Алдаа гарлаа',
            details: error.message
        });
    }
};

// Check if product is in watchlist
exports.checkWatchlist = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user._id;

        const watchlist = await Watchlist.findOne({ user: userId, product: productId });

        res.json({
            success: true,
            isWatched: !!watchlist,
            watchlist: watchlist || null
        });

    } catch (error) {
        console.error('Check watchlist error:', error);
        res.status(500).json({
            error: 'Алдаа гарлаа',
            details: error.message
        });
    }
};

// Get watchlist count for a product
exports.getWatchlistCount = async (req, res) => {
    try {
        const { productId } = req.params;

        const count = await Watchlist.countDocuments({ product: productId });

        res.json({
            success: true,
            count
        });

    } catch (error) {
        console.error('Get watchlist count error:', error);
        res.status(500).json({
            error: 'Алдаа гарлаа',
            details: error.message
        });
    }
};
