const User = require('../models/User');
const Product = require('../models/Product');
const Transaction = require('../models/transaction');
const Bidding = require('../models/bidding');

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
    try {
        const stats = await Promise.all([
            // Total users
            User.countDocuments(),

            // Active listings
            Product.countDocuments({ available: true, sold: false }),

            // Sold products
            Product.countDocuments({ sold: true }),

            // Total revenue
            Transaction.aggregate([
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),

            // New users this week
            User.countDocuments({
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }),

            // New users this month
            User.countDocuments({
                createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            }),

            // Total bids
            Bidding.countDocuments(),

            // Average product price
            Product.aggregate([
                { $match: { available: true } },
                { $group: { _id: null, avgPrice: { $avg: '$price' } } }
            ])
        ]);

        res.json({
            success: true,
            stats: {
                totalUsers: stats[0],
                activeListings: stats[1],
                soldProducts: stats[2],
                totalRevenue: stats[3][0]?.total || 0,
                newUsersThisWeek: stats[4],
                newUsersThisMonth: stats[5],
                totalBids: stats[6],
                avgProductPrice: stats[7][0]?.avgPrice || 0
            }
        });

    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            error: 'Статистик татахад алдаа гарлаа',
            details: error.message
        });
    }
};

// Get sales chart data
exports.getSalesChart = async (req, res) => {
    try {
        const { period = '30d' } = req.query;

        const daysAgo = period === '30d' ? 30 : period === '7d' ? 7 : 90;
        const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

        const sales = await Transaction.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    count: { $sum: 1 },
                    revenue: { $sum: '$amount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            sales
        });

    } catch (error) {
        console.error('Get sales chart error:', error);
        res.status(500).json({
            error: 'Алдаа гарлаа',
            details: error.message
        });
    }
};

// Get recently joined users
exports.getRecentUsers = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;

        const users = await User.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('name email photo phone role createdAt balance trustScore');

        res.json({
            success: true,
            users
        });

    } catch (error) {
        console.error('Get recent users error:', error);
        res.status(500).json({
            error: 'Алдаа гарлаа',
            details: error.message
        });
    }
};

// Get top sellers
exports.getTopSellers = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const topSellers = await Transaction.aggregate([
            {
                $group: {
                    _id: '$seller',
                    totalSales: { $sum: 1 },
                    totalRevenue: { $sum: '$amount' }
                }
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'seller'
                }
            },
            { $unwind: '$seller' },
            {
                $project: {
                    _id: 1,
                    totalSales: 1,
                    totalRevenue: 1,
                    'seller.name': 1,
                    'seller.email': 1,
                    'seller.photo': 1,
                    'seller.trustScore': 1
                }
            }
        ]);

        res.json({
            success: true,
            topSellers
        });

    } catch (error) {
        console.error('Get top sellers error:', error);
        res.status(500).json({
            error: 'Алдаа гарлаа',
            details: error.message
        });
    }
};

// Get category statistics
exports.getCategoryStats = async (req, res) => {
    try {
        const stats = await Product.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    avgPrice: { $avg: '$price' },
                    totalSold: {
                        $sum: { $cond: ['$sold', 1, 0] }
                    }
                }
            },
            { $sort: { count: -1 } }
        ]);

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('Get category stats error:', error);
        res.status(500).json({
            error: 'Алдаа гарлаа',
            details: error.message
        });
    }
};

// Get user activity over time
exports.getUserActivityChart = async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        const daysAgo = period === '30d' ? 30 : period === '7d' ? 7 : 90;
        const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

        const activity = await User.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    newUsers: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            activity
        });

    } catch (error) {
        console.error('Get user activity error:', error);
        res.status(500).json({
            error: 'Алдаа гарлаа',
            details: error.message
        });
    }
};
