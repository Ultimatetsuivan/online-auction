/**
 * Bidding Service
 * Handles bid placement with transaction safety and race condition prevention
 */

// Tiered minimum bid increment based on starting price
function calcMinIncrement(startingPrice) {
    if (startingPrice < 10000)   return 100;
    if (startingPrice < 100000)  return 1000;
    if (startingPrice < 1000000) return 5000;
    if (startingPrice < 10000000) return 50000;
    if (startingPrice < 100000000) return 100000;
    return 500000;
}

const BiddingProduct = require('../models/bidding');
const Product = require('../models/product');
const User = require('../models/User');
const Deposit = require('../models/Deposit');
const logger = require('../utils/logger');
const { withTransaction, atomicUpdate } = require('../utils/transactionHelper');
const { AuctionError, ValidationError, NotFoundError, ForbiddenError } = require('../utils/errors');

/**
 * Place a bid on a product with transaction safety
 * Prevents race conditions using atomic operations
 *
 * @param {string} productId - Product ID to bid on
 * @param {string} userId - User placing the bid
 * @param {number} bidAmount - Bid amount
 * @returns {Promise<Object>} - Bid result
 */
async function placeBid(productId, userId, bidAmount) {
    // Input validation
    if (!productId || !userId || !bidAmount) {
        throw new ValidationError('Бүх талбарыг бөглөнө үү');
    }

    if (typeof bidAmount !== 'number' || bidAmount <= 0) {
        throw new ValidationError('Үнийн дүн тоо байх ёстой');
    }

    // Execute bid placement in transaction
    const result = await withTransaction(async (session) => {
        // 1. Fetch product with session lock
        let query = Product.findById(productId).populate('user', 'name email');
        if (session) {
            query = query.session(session);
        }
        const product = await query;

        if (!product) {
            throw new NotFoundError('Бараа');
        }

        // 2. Validate auction status
        if (product.sold) {
            throw new AuctionError('Энэ бараа аль хэдийн зарагдсан байна', 400);
        }

        if (!product.available) {
            throw new AuctionError('Энэ бараанд үнэ санал болгох боломжгүй', 400);
        }

        if (product.auctionStatus !== 'active') {
            throw new AuctionError('Энэ аукшин идэвхтэй биш байна', 400);
        }

        // 3. Check if bidder is the seller
        const sellerId = product.user?._id || product.user;
        if (sellerId.toString() === userId.toString()) {
            throw new ForbiddenError('Худалдагч өөрийн бараанд санал өгөх боломжгүй');
        }

        // 3.5. Check deposit requirement for high-value items
        const DEPOSIT_THRESHOLD = parseInt(process.env.DEPOSIT_THRESHOLD) || 500000;
        if (product.price >= DEPOSIT_THRESHOLD) {
            let depositQuery = Deposit.findOne({ user: userId, product: productId, status: 'held' });
            if (session) depositQuery = depositQuery.session(session);
            const activeDeposit = await depositQuery;
            if (!activeDeposit) {
                const depositPercentage = parseFloat(process.env.DEPOSIT_PERCENTAGE) || 0.1;
                const depositAmount = Math.floor(product.price * depositPercentage);
                const err = new AuctionError(
                    'Энэ дуудлагад оролцохын тулд дэнчин байршуулна уу',
                    403
                );
                err.requiresDeposit = true;
                err.depositAmount = depositAmount;
                throw err;
            }
        }

        // 4. Get current highest bid atomically
        let highestBidQuery = BiddingProduct.findOne({ product: productId }).sort({ price: -1 });
        if (session) {
            highestBidQuery = highestBidQuery.session(session);
        }
        const highestBid = await highestBidQuery;

        // 5. Validate bid amount
        const minBidAmount = highestBid
            ? highestBid.price + calcMinIncrement(product.price)
            : product.price;

        if (bidAmount < minBidAmount) {
            throw new AuctionError(
                `Үнийн дүн ${minBidAmount.toLocaleString()}₮-аас дээш байх ёстой`,
                400
            );
        }

        // 6. Check user's previous bid
        let userPreviousBidQuery = BiddingProduct.findOne({
            user: userId,
            product: productId
        }).sort({ price: -1 });
        if (session) {
            userPreviousBidQuery = userPreviousBidQuery.session(session);
        }
        const userPreviousBid = await userPreviousBidQuery;

        if (userPreviousBid && bidAmount <= userPreviousBid.price) {
            throw new AuctionError(
                'Та өмнөх үнийн дүнгээс өндөр үнийн дүн байршуулна уу',
                400
            );
        }

        // 7. Create new bid record
        const newBid = session
            ? await BiddingProduct.create(
                [{
                    user: userId,
                    product: productId,
                    price: bidAmount
                }],
                { session }
            )
            : [await BiddingProduct.create({
                user: userId,
                product: productId,
                price: bidAmount
            })];

        // 8. Update product atomically (prevents race conditions)
        const updateOptions = {
            new: true
        };
        if (session) {
            updateOptions.session = session;
        }

        const updatedProduct = await Product.findOneAndUpdate(
            {
                _id: productId,
                __v: product.__v // Optimistic locking
            },
            {
                $set: {
                    currentBid: bidAmount,
                    highestBidder: userId
                },
                $inc: { __v: 1 } // Increment version
            },
            updateOptions
        );

        if (!updatedProduct) {
            throw new AuctionError(
                'Өөр хэрэглэгч яг одоо санал өгсөн байна. Дахин оролдоно уу',
                409
            );
        }

        // 9. Populate bid user for response
        await newBid[0].populate('user', 'name email photo');

        // Log successful bid
        logger.audit('BID_PLACED', {
            userId,
            productId,
            bidAmount,
            previousHighestBid: highestBid?.price || null
        });

        return {
            bid: newBid[0],
            product: updatedProduct,
            previousHighestBidder: highestBid?.user || null
        };

    }, {
        maxRetries: 3, // Retry up to 3 times on conflicts
        retryDelay: 100 // Start with 100ms delay
    });

    return result;
}

/**
 * Get bid history for a product
 * @param {string} productId - Product ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Bid history
 */
async function getBidHistory(productId, options = {}) {
    const {
        limit = 50,
        skip = 0,
        sort = { createdAt: -1 }
    } = options;

    const bids = await BiddingProduct.find({ product: productId })
        .populate('user', 'name email photo trustScore')
        .sort(sort)
        .limit(limit)
        .skip(skip)
        .lean();

    return bids;
}

/**
 * Get user's bid history
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - User's bids
 */
async function getUserBids(userId, options = {}) {
    const {
        limit = 50,
        skip = 0,
        productId = null
    } = options;

    const query = { user: userId };
    if (productId) {
        query.product = productId;
    }

    const bids = await BiddingProduct.find(query)
        .populate('product', 'title images currentBid auctionStatus')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

    return bids;
}

/**
 * Get highest bid for a product
 * @param {string} productId - Product ID
 * @returns {Promise<Object|null>} - Highest bid or null
 */
async function getHighestBid(productId) {
    const highestBid = await BiddingProduct.findOne({ product: productId })
        .sort({ price: -1 })
        .populate('user', 'name email photo')
        .lean();

    return highestBid;
}

/**
 * Validate if user can bid on product
 * @param {string} productId - Product ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Validation result
 */
async function validateBidEligibility(productId, userId) {
    const product = await Product.findById(productId).populate('user', '_id');

    if (!product) {
        return {
            canBid: false,
            reason: 'Бараа олдсонгүй'
        };
    }

    if (product.sold) {
        return {
            canBid: false,
            reason: 'Бараа зарагдсан байна'
        };
    }

    if (!product.available) {
        return {
            canBid: false,
            reason: 'Бараа боломжгүй байна'
        };
    }

    if (product.auctionStatus !== 'active') {
        return {
            canBid: false,
            reason: 'Аукшин идэвхтэй биш байна'
        };
    }

    const sellerId = product.user?._id || product.user;
    if (sellerId.toString() === userId.toString()) {
        return {
            canBid: false,
            reason: 'Өөрийн бараанд санал өгөх боломжгүй'
        };
    }

    return {
        canBid: true,
        product
    };
}

module.exports = {
    placeBid,
    getBidHistory,
    getUserBids,
    getHighestBid,
    validateBidEligibility
};
