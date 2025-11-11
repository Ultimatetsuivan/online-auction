const Like = require('../models/Like');
const Product = require('../models/Product');

// Toggle like on a product
exports.toggleLike = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user._id;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                error: 'Бүтээгдэхүүн олдсонгүй'
            });
        }

        // Check if already liked
        const existingLike = await Like.findOne({ user: userId, product: productId });

        if (existingLike) {
            // Unlike
            await Like.deleteOne({ _id: existingLike._id });
            return res.json({
                success: true,
                liked: false,
                message: 'Таалагдсанаас хасагдлаа'
            });
        }

        // Like
        await Like.create({ user: userId, product: productId });

        res.json({
            success: true,
            liked: true,
            message: 'Таалагдсанд нэмэгдлээ'
        });

    } catch (error) {
        console.error('Toggle like error:', error);
        res.status(500).json({
            error: 'Алдаа гарлаа',
            details: error.message
        });
    }
};

// Get user's liked products
exports.getMyLikes = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const likes = await Like.find({ user: userId })
            .populate({
                path: 'product',
                select: 'title slug description images price currentBid bidDeadline sold',
                populate: {
                    path: 'user',
                    select: 'name photo'
                }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Like.countDocuments({ user: userId });

        // Filter out likes where product was deleted
        const validLikes = likes.filter(like => like.product !== null);

        res.json({
            success: true,
            likes: validLikes,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get likes error:', error);
        res.status(500).json({
            error: 'Алдаа гарлаа',
            details: error.message
        });
    }
};

// Check if user liked a product
exports.checkLike = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user._id;

        const like = await Like.findOne({ user: userId, product: productId });

        res.json({
            success: true,
            liked: !!like
        });

    } catch (error) {
        console.error('Check like error:', error);
        res.status(500).json({
            error: 'Алдаа гарлаа',
            details: error.message
        });
    }
};

// Get like count for a product
exports.getLikeCount = async (req, res) => {
    try {
        const { productId } = req.params;

        const count = await Like.countDocuments({ product: productId });

        res.json({
            success: true,
            count
        });

    } catch (error) {
        console.error('Get like count error:', error);
        res.status(500).json({
            error: 'Алдаа гарлаа',
            details: error.message
        });
    }
};
