const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const BiddingProduct = require("../models/bidding");
const Product = require("../models/Product");
const User = require("../models/User");
const Transaction = require("../models/transaction");
const {sendEmail} = require("../utils/mail");
const { sendPushNotification, notifyProductLikers } = require("../utils/pushNotification");
const { createNotification } = require("./notificationController");
const { updateTrustScore } = require("../utils/trustScore");
const { getIO } = require("../utils/socket");
const biddingService = require("../services/biddingService");
const notificationService = require("../services/notificationService");
const logger = require("../utils/logger");


const getBiddingHistory = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const biddingHistory = await BiddingProduct.find({ product: productId })
    .sort('-createdAt')
    .populate('user')
    .populate('product');


  res.status(200).json({ history: biddingHistory });
});
/**
 * Place a bid on a product
 * NOW WITH TRANSACTION SAFETY - NO MORE RACE CONDITIONS!
 */
const placeBid = asyncHandler(async (req, res) => {
  const { productId, price } = req.body;
  const userId = req.user.id;

  try {
      // Use bidding service with transaction safety
      const result = await biddingService.placeBid(productId, userId, price);

      const { bid, product, previousHighestBidder } = result;

      // Emit real-time socket events
      try {
          const io = getIO();
          io.emit('bidUpdate', product);
          io.emit('newBid', {
              _id: bid._id,
              user: bid.user,
              product: productId,
              price: bid.price,
              createdAt: bid.createdAt
          });
          logger.info('Socket events emitted for new bid', {
              productId,
              price,
              userId
          });
      } catch (socketError) {
          logger.warn('Socket emission failed', { error: socketError.message });
          // Don't fail the bid if socket fails
      }

      // Notify previous highest bidder (if exists and different from current bidder)
      if (previousHighestBidder && previousHighestBidder.toString() !== userId.toString()) {
          await notificationService.notifyOutbid(
              previousHighestBidder,
              product,
              price
          );
      }

      // Notify product owner of new bid
      const sellerId = product.user?._id || product.user;
      logger.info('Notifying seller of new bid', {
          sellerId: sellerId?.toString(),
          bidderId: userId.toString(),
          productId,
          price
      });

      if (sellerId && sellerId.toString() !== userId.toString()) {
          const notifyResult = await notificationService.notify(sellerId, {
              type: 'new_bid',
              title: 'Шинэ үнийн санал',
              message: `"${product.title}" дээр ${price.toLocaleString()}₮ үнэ санал ирлээ`,
              productId: productId,
              actionUrl: `/products/${productId}`
          });

          logger.info('Seller notification result', {
              success: notifyResult.success,
              sellerId: sellerId.toString()
          });
      } else {
          logger.warn('Skipped seller notification', {
              reason: sellerId ? 'seller is bidder' : 'no sellerId',
              sellerId: sellerId?.toString(),
              bidderId: userId.toString()
          });
      }

      // Return success response
      res.status(200).json({
          success: true,
          biddingProduct: bid,
          product,
          reserveMet: !product.reservePrice || product.currentBid >= product.reservePrice
      });

  } catch (error) {
      // Handle deposit requirement specially (need to pass extra fields)
      if (error.requiresDeposit) {
          return res.status(403).json({
              success: false,
              requiresDeposit: true,
              depositAmount: error.depositAmount,
              error: error.message
          });
      }
      // Let error middleware handle all other errors
      throw error;
  }
});
const checkUserBidStatus = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user._id;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const userBid = await BiddingProduct.findOne({ 
    user: userId, 
    product: productId 
  }).sort({ price: -1 });

  const isOutbid = userBid ? (product.currentBid > userBid.price) : false;

  res.status(200).json({
    isOutbid,
    currentBid: product.currentBid,
    userBid: userBid?.price || null
  });
});

const getMyBids = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const myBidGroups = await BiddingProduct.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    { $sort: { price: -1, createdAt: -1 } },
    {
      $group: {
        _id: "$product",
        userMaxBid: { $first: "$price" },
        lastBidAt: { $first: "$createdAt" }
      }
    }
  ]);

  if (!myBidGroups.length) {
    return res.status(200).json({ bids: [] });
  }

  const productIds = myBidGroups.map((bid) => bid._id);
  const products = await Product.find({
    _id: { $in: productIds },
    auctionStatus: { $in: ['active', 'ended'] } // Filter out scheduled auctions
  })
    .select("title images currentBid highestBidder bidDeadline auctionStatus")
    .lean();

  const productMap = new Map(
    products.map((product) => [product._id.toString(), product])
  );

  const now = Date.now();
  const bids = myBidGroups
    .map((bid) => {
      const product = productMap.get(bid._id.toString());
      if (!product) return null;

      const timeRemaining = product.bidDeadline
        ? Math.max(new Date(product.bidDeadline).getTime() - now, 0)
        : null;

      const primaryImage =
        product.images?.find?.((img) => img.isPrimary)?.url ||
        product.images?.[0]?.url ||
        null;

      return {
        productId: product._id,
        title: product.title,
        image: primaryImage,
        userMaxBid: bid.userMaxBid,
        currentHighestBid: product.currentBid ?? 0,
        isLeading:
          product.highestBidder?.toString() === userId.toString(),
        timeRemaining,
        auctionStatus: product.auctionStatus
          ? product.auctionStatus.toUpperCase()
          : "ACTIVE",
        lastBidAt: bid.lastBidAt
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.lastBidAt) - new Date(a.lastBidAt))
    .map(({ lastBidAt, ...rest }) => rest);

  res.status(200).json({ bids });
});

const getMyWins = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const myBidGroups = await BiddingProduct.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    { $sort: { price: -1, createdAt: -1 } },
    {
      $group: {
        _id: "$product",
        userMaxBid: { $first: "$price" },
        lastBidAt: { $first: "$createdAt" }
      }
    }
  ]);

  if (!myBidGroups.length) {
    return res.status(200).json({ wins: [] });
  }

  const productIds = myBidGroups.map((bid) => bid._id);
  const products = await Product.find({
    _id: { $in: productIds },
    auctionStatus: { $in: ['active', 'ended'] } // Filter out scheduled auctions
  })
    .select("title images currentBid highestBidder bidDeadline auctionStatus sold soldTo")
    .lean();

  const productMap = new Map(
    products.map((product) => [product._id.toString(), product])
  );

  const wins = myBidGroups
    .map((bid) => {
      const product = productMap.get(bid._id.toString());
      if (!product) return null;

      const isWinner =
        (product.sold && product.soldTo?.toString() === userId.toString()) ||
        (product.auctionStatus === "ended" &&
          product.highestBidder?.toString() === userId.toString());

      if (!isWinner) return null;

      const primaryImage =
        product.images?.find?.((img) => img.isPrimary)?.url ||
        product.images?.[0]?.url ||
        null;

      return {
        productId: product._id,
        title: product.title,
        image: primaryImage,
        userMaxBid: bid.userMaxBid,
        finalPrice: product.currentBid ?? bid.userMaxBid,
        auctionStatus: product.auctionStatus
          ? product.auctionStatus.toUpperCase()
          : "ENDED",
        result: "won",
        lastBidAt: bid.lastBidAt
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.lastBidAt) - new Date(a.lastBidAt))
    .map(({ lastBidAt, ...rest }) => rest);

  res.status(200).json({ wins });
});

const getMyLosses = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const myBidGroups = await BiddingProduct.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    { $sort: { price: -1, createdAt: -1 } },
    {
      $group: {
        _id: "$product",
        userMaxBid: { $first: "$price" },
        lastBidAt: { $first: "$createdAt" }
      }
    }
  ]);

  if (!myBidGroups.length) {
    return res.status(200).json({ losses: [] });
  }

  const productIds = myBidGroups.map((bid) => bid._id);
  const products = await Product.find({
    _id: { $in: productIds },
    auctionStatus: { $in: ['active', 'ended'] } // Filter out scheduled auctions
  })
    .select("title images currentBid highestBidder bidDeadline auctionStatus sold soldTo")
    .lean();

  const productMap = new Map(
    products.map((product) => [product._id.toString(), product])
  );

  const losses = myBidGroups
    .map((bid) => {
      const product = productMap.get(bid._id.toString());
      if (!product) return null;

      const auctionEnded = product.auctionStatus === "ended" || product.sold;
      const isWinner =
        (product.sold && product.soldTo?.toString() === userId.toString()) ||
        (product.auctionStatus === "ended" &&
          product.highestBidder?.toString() === userId.toString());

      if (!auctionEnded || isWinner) return null;

      const primaryImage =
        product.images?.find?.((img) => img.isPrimary)?.url ||
        product.images?.[0]?.url ||
        null;

      return {
        productId: product._id,
        title: product.title,
        image: primaryImage,
        userMaxBid: bid.userMaxBid,
        finalPrice: product.currentBid ?? 0,
        auctionStatus: product.auctionStatus
          ? product.auctionStatus.toUpperCase()
          : "ENDED",
        result: "lost",
        lastBidAt: bid.lastBidAt
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.lastBidAt) - new Date(a.lastBidAt))
    .map(({ lastBidAt, ...rest }) => rest);

  res.status(200).json({ losses });
});

const sellProduct = asyncHandler(async (req, res) => {
  const { productId, price } = req.body;
  const userId = req.user.id;

  try {
    const product = await Product.findById(productId);
    if (!product) throw new Error("Бараа олдсонгүй");
    if (product.sold) throw new Error("Энэ бараа өмнө нь зарагдсан байна");

    const buyer = await User.findById(userId);
    if (!buyer) throw new Error("Худалдан авагчийн мэдээлэл олдсонгүй");
    if (buyer.balance < price) throw new Error("Таны дансны үлдэгдэл хүрэлцэхгүй байна");

    const seller = await User.findById(product.user);
    if (!seller) throw new Error("Барааны эзэний мэдээлэл олдсонгүй");

    const updates = await Promise.all([
      User.updateOne(
        { _id: userId },
        { $inc: { balance: -price } }
      ),
      User.updateOne(
        { _id: product.user },
        { $inc: { balance: price } }
      ),
      Product.updateOne(
        { _id: productId },
        { 
          $set: {
            sold: true,
            soldTo: userId,
            soldAt: new Date(),
            currentBid: price
          }
        }
      ),
      Transaction.create({
        buyer: userId,
        seller: product.user,
        product: productId,
        amount: price,
        status: 'completed'
      }),
      BiddingProduct.create({
        user: userId,
        product: productId,
        price: price
      })
    ]);

    // Update trust scores
    await updateTrustScore(userId, 'completed');

    try {
      await Promise.all([
        sendEmail({
          email: buyer.email,
          subject: "Баяр хүргэе! Та амжилттай худалдан авлаа!",
          html: `Таны худалдан авсан "<strong>${product.title}</strong>" барааны үнэ <strong>${price}₮</strong> байна.`
        }),
        sendEmail({
          email: seller.email,
          subject: "Бараа амжилттай зарагдлаа",
          html: `Таны "${product.title}" бараа ${price} төгрөгөөр ${buyer.email}-email тэй ${buyer.name} хэрэглэгчид зарагдлаа.`
        })
      ]);

      // Send push notifications
      await Promise.all([
        sendPushNotification(userId, {
          title: "Худалдан авалт амжилттай",
          body: `Та "${product.title}"-г ${price.toLocaleString()}₮-өөр худалдан авлаа`,
          type: "won_auction",
          productId: productId,
          actionUrl: `/products/${productId}`
        }),
        sendPushNotification(product.user, {
          title: "Бараа зарагдлаа",
          body: `"${product.title}" ${price.toLocaleString()}₮-өөр зарагдлаа`,
          type: "sold",
          productId: productId,
          actionUrl: `/products/${productId}`
        })
      ]);

      // Create in-app notifications
      await Promise.all([
        createNotification(userId, {
          type: "won_auction",
          productId: productId,
          title: "Худалдан авалт амжилттай",
          message: `Та "${product.title}"-г ${price.toLocaleString()}₮-өөр худалдан авлаа`,
          actionUrl: `/products/${productId}`
        }),
        createNotification(product.user, {
          type: "sold",
          productId: productId,
          title: "Бараа зарагдлаа",
          message: `"${product.title}" ${price.toLocaleString()}₮-өөр зарагдлаа`,
          actionUrl: `/products/${productId}`
        })
      ]);
    } catch (emailError) {
    }

    // 6. Амжилттай хариу буцаах
    return res.status(200).json({ 
      success: true,
      message: "Бараа амжилттай зарагдлаа!",
      data: {
        productId: productId,
        productName: product.title,
        price: price,
        buyerId: userId,
        soldAt: new Date()
      }
    });

  } catch (error) {
    res.status(400).json({ 
      success: false,
      message: error.message || "Бараа зарах үед алдаа гарлаа",
      error: error.message
    });
  }
});


module.exports = { 
    getBiddingHistory, 
    placeBid,
    sellProduct,
    checkUserBidStatus,
    getMyBids,
    getMyWins,
    getMyLosses
};
