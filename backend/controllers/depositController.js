const Deposit = require('../models/Deposit');
const Product = require('../models/Product');
const User = require('../models/User');
const { canPlaceDeposit } = require('../utils/trustScore');

// Place deposit on a product
exports.placeDeposit = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.user._id;

        // Get user with trust score
        const user = await User.findById(userId);

        // Check if user can place deposit
        if (!canPlaceDeposit(user)) {
            const minScore = parseInt(process.env.MIN_TRUST_SCORE_FOR_DEPOSIT) || 70;
            return res.status(403).json({
                error: `Дэнчин байршуулахын тулд таны итгэлцлийн оноо ${minScore}+ байх ёстой`,
                currentScore: user.trustScore,
                requiredScore: minScore
            });
        }

        // Check if product exists and is available
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                error: 'Бүтээгдэхүүн олдсонгүй'
            });
        }

        if (!product.available || product.sold) {
            return res.status(400).json({
                error: 'Энэ бүтээгдэхүүнд дэнчин байршуулах боломжгүй'
            });
        }

        // Check if auction has ended
        if (new Date() > product.bidDeadline) {
            return res.status(400).json({
                error: 'Дуудлага худалдаа дууссан байна'
            });
        }

        // Check if user already placed deposit on this product
        const existingDeposit = await Deposit.findOne({
            user: userId,
            product: productId,
            status: 'held'
        });

        if (existingDeposit) {
            return res.status(400).json({
                error: 'Та энэ бүтээгдэхүүнд аль хэдийн дэнчин байршуулсан байна',
                deposit: existingDeposit
            });
        }

        // Calculate deposit amount (10% of current price or starting price)
        const depositPercentage = parseFloat(process.env.DEPOSIT_PERCENTAGE) || 0.1;
        const depositAmount = Math.floor(product.price * depositPercentage);

        // Check if user has sufficient balance
        if (user.balance < depositAmount) {
            return res.status(400).json({
                error: 'Дансны үлдэгдэл хүрэлцэхгүй байна',
                required: depositAmount,
                current: user.balance
            });
        }

        // Deduct deposit from user balance
        user.balance -= depositAmount;
        await user.save();

        // Create deposit record
        const deposit = await Deposit.create({
            user: userId,
            product: productId,
            amount: depositAmount,
            status: 'held'
        });

        res.json({
            success: true,
            message: 'Дэнчин амжилттай байршуулагдлаа',
            deposit,
            remainingBalance: user.balance
        });

    } catch (error) {
        console.error('Place deposit error:', error);
        res.status(500).json({
            error: 'Дэнчин байршуулахад алдаа гарлаа',
            details: error.message
        });
    }
};

// Get user's deposits
exports.getMyDeposits = async (req, res) => {
    try {
        const userId = req.user._id;
        const status = req.query.status; // 'held', 'returned', 'forfeited'

        const query = { user: userId };
        if (status) {
            query.status = status;
        }

        const deposits = await Deposit.find(query)
            .populate('product', 'title slug images price currentBid bidDeadline sold')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            deposits
        });

    } catch (error) {
        console.error('Get deposits error:', error);
        res.status(500).json({
            error: 'Дэнчин татахад алдаа гарлаа',
            details: error.message
        });
    }
};

// Return deposit (called when user wins or auction ends)
exports.returnDeposit = async (depositId, reason) => {
    try {
        const deposit = await Deposit.findById(depositId);

        if (!deposit || deposit.status !== 'held') {
            return { success: false, error: 'Deposit not found or not held' };
        }

        // Return money to user
        await User.findByIdAndUpdate(deposit.user, {
            $inc: { balance: deposit.amount }
        });

        // Update deposit status
        deposit.status = 'returned';
        deposit.releasedAt = new Date();
        deposit.reason = reason || 'Auction ended';
        await deposit.save();

        return { success: true, deposit };
    } catch (error) {
        console.error('Return deposit error:', error);
        return { success: false, error: error.message };
    }
};

// Forfeit deposit (called when user cancels bid or doesn't pay)
exports.forfeitDeposit = async (depositId, reason) => {
    try {
        const deposit = await Deposit.findById(depositId);

        if (!deposit || deposit.status !== 'held') {
            return { success: false, error: 'Deposit not found or not held' };
        }

        // Update deposit status (money is not returned)
        deposit.status = 'forfeited';
        deposit.releasedAt = new Date();
        deposit.reason = reason || 'Bid cancelled or payment failed';
        await deposit.save();

        // Penalize user trust score
        const { updateTrustScore } = require('../utils/trustScore');
        await updateTrustScore(deposit.user, 'cancelled');

        return { success: true, deposit };
    } catch (error) {
        console.error('Forfeit deposit error:', error);
        return { success: false, error: error.message };
    }
};

// Admin: Get all deposits
exports.getAllDeposits = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const status = req.query.status;

        const query = {};
        if (status) {
            query.status = status;
        }

        const deposits = await Deposit.find(query)
            .populate('user', 'name email phone')
            .populate('product', 'title slug price')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Deposit.countDocuments(query);

        res.json({
            success: true,
            deposits,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get all deposits error:', error);
        res.status(500).json({
            error: 'Алдаа гарлаа',
            details: error.message
        });
    }
};

module.exports.returnDeposit = exports.returnDeposit;
module.exports.forfeitDeposit = exports.forfeitDeposit;
