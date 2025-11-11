const asyncHandler = require("express-async-handler");
const BiddingProduct = require("../models/bidding");
const Product = require("../models/Product");
const User = require("../models/User");
const Transaction = require("../models/transaction");
const {sendEmail} = require("../utils/mail");
const { sendPushNotification, notifyProductLikers } = require("../utils/pushNotification");
const { createNotification } = require("./notificationController");
const { updateTrustScore } = require("../utils/trustScore");


const getBiddingHistory = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const biddingHistory = await BiddingProduct.find({ product: productId })
    .sort('-createdAt')
    .populate('user')
    .populate('product');


  res.status(200).json({ history: biddingHistory });
});
const placeBid = asyncHandler(async (req, res) => {
  const { productId, price } = req.body;
  const userId = req.user.id;

  if (!productId || !price) {
      return res.status(400).json({ message: "Бүх талбарыг бөглөнө үү" });
  }

  const product = await Product.findById(productId);
  if (!product || product.sold) {
      return res.status(400).json({ message: "Энэ бараанд үнэ санал болгох боломжгүй" });
  }

  try {
      // Store previous highest bidder before any changes
      const previousHighestBid = await BiddingProduct.findOne({ product: productId })
          .sort({ price: -1 });
      const previousHighestBidder = previousHighestBid?.user;

      if (product.bidThreshold && price >= product.bidThreshold) {
          product.sold = true;
          product.soldTo = userId;
          product.currentBid = price;
          await product.save();

          const biddingProduct = await BiddingProduct.create({
              user: userId,
              product: productId,
              price: price
          });

          const buyer = await User.findById(userId);
          const seller = await User.findById(product.user);

          // Update trust scores
          await updateTrustScore(userId, 'completed');

          // Send emails
          await sendEmail({
              email: buyer.email,
              subject: "Баяр хүргэе! Та дуудлага худалдаанд яллаа!",
              html: `Та энэхүү барааг "${product.title}"-г ${price} төгрөгөөр худалдан авлаа.`
          });

          await sendEmail({
              email: seller.email,
              subject: "Бараа амжилттай зарагдлаа",
              html: `Таны "${product.title}" бараа ${price} төгрөгөөр ${buyer.email}-email тэй ${buyer.name} хэрэглэгчид зарагдлаа.`
          });

          // Send push notifications
          await sendPushNotification(userId, {
              title: "Баяр хүргэе!",
              body: `Та "${product.title}"-г ${price.toLocaleString()}₮-өөр худалдан авлаа`,
              type: "won_auction",
              productId: productId,
              actionUrl: `/product/${productId}`
          });

          await sendPushNotification(product.user, {
              title: "Бараа зарагдлаа",
              body: `"${product.title}" ${price.toLocaleString()}₮-өөр зарагдлаа`,
              type: "sold",
              productId: productId,
              actionUrl: `/product/${productId}`
          });

          // Create in-app notifications
          await createNotification(userId, {
              type: "won_auction",
              productId: productId,
              title: "Баяр хүргэе!",
              message: `Та "${product.title}"-г ${price.toLocaleString()}₮-өөр худалдан авлаа`,
              actionUrl: `/product/${productId}`
          });

          await createNotification(product.user, {
              type: "sold",
              productId: productId,
              title: "Бараа зарагдлаа",
              message: `"${product.title}" ${price.toLocaleString()}₮-өөр зарагдлаа`,
              actionUrl: `/product/${productId}`
          });

          // Notify users who liked this product
          await notifyProductLikers(productId, {
              title: "Таалагдсан бараа зарагдлаа",
              body: `"${product.title}" зарагдлаа`,
              type: "like_update",
              productId: productId,
              actionUrl: `/product/${productId}`
          });

          return res.status(200).json({
              message: "Бараа амжилттай зарагдлаа!",
              sold: true,
              buyerId: userId,
              product: product,
              biddingProduct: biddingProduct
          });
      }

      const existingUserBid = await BiddingProduct.findOne({ 
          user: userId, 
          product: productId 
      });
      
      if (existingUserBid) {
          if (price <= existingUserBid.price) {
              return res.status(400).json({ 
                  message: "Та өмнөх үнийн дүнгээс өндөр үнийн дүн байршуулна уу" 
              });
          }
          existingUserBid.price = price;
          await existingUserBid.save();
          
          product.currentBid = price;
          await product.save();
          
          return res.status(200).json({ 
              biddingProduct: existingUserBid,
              product 
          });
      }

      const highestBid = await BiddingProduct.findOne({ product: productId })
          .sort({ price: -1 });
      
      if (highestBid && price <= highestBid.price) {
          return res.status(400).json({ 
              message: "Та өмнөх үнийн дүнгээс өндөр үнийн дүн байршуулна уу" 
          });
      }

      const biddingProduct = await BiddingProduct.create({
          user: userId,
          product: productId,
          price,
      });

      product.currentBid = price;
      product.highestBidder = userId;
      await product.save();

      // Notify previous highest bidder that they've been outbid
      if (previousHighestBidder && previousHighestBidder.toString() !== userId.toString()) {
          await sendPushNotification(previousHighestBidder, {
              title: "Таны үнийн санал давлаа",
              body: `"${product.title}" дээр илүү өндөр үнэ санал ирлээ`,
              type: "outbid",
              productId: productId,
              actionUrl: `/product/${productId}`,
              image: product.images?.[0]?.url
          });

          await createNotification(previousHighestBidder, {
              type: "outbid",
              productId: productId,
              title: "Таны үнийн санал давлаа",
              message: `"${product.title}" дээр илүү өндөр үнэ санал ирлээ`,
              actionUrl: `/product/${productId}`
          });
      }

      // Notify product owner of new bid
      if (product.user.toString() !== userId.toString()) {
          await sendPushNotification(product.user, {
              title: "Шинэ үнийн санал",
              body: `"${product.title}" дээр ${price.toLocaleString()}₮ үнэ санал ирлээ`,
              type: "new_bid",
              productId: productId,
              actionUrl: `/product/${productId}`
          });

          await createNotification(product.user, {
              type: "new_bid",
              productId: productId,
              title: "Шинэ үнийн санал",
              message: `"${product.title}" дээр ${price.toLocaleString()}₮ үнэ санал ирлээ`,
              actionUrl: `/product/${productId}`
          });
      }

      res.status(200).json({
          biddingProduct,
          product
      });

  } catch (error) {
      console.error('Bidding error:', error);
      res.status(500).json({ 
          message: "Үнийн санал өгөхөд алдаа гарлаа" 
      });
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
          actionUrl: `/product/${productId}`
        }),
        sendPushNotification(product.user, {
          title: "Бараа зарагдлаа",
          body: `"${product.title}" ${price.toLocaleString()}₮-өөр зарагдлаа`,
          type: "sold",
          productId: productId,
          actionUrl: `/product/${productId}`
        })
      ]);

      // Create in-app notifications
      await Promise.all([
        createNotification(userId, {
          type: "won_auction",
          productId: productId,
          title: "Худалдан авалт амжилттай",
          message: `Та "${product.title}"-г ${price.toLocaleString()}₮-өөр худалдан авлаа`,
          actionUrl: `/product/${productId}`
        }),
        createNotification(product.user, {
          type: "sold",
          productId: productId,
          title: "Бараа зарагдлаа",
          message: `"${product.title}" ${price.toLocaleString()}₮-өөр зарагдлаа`,
          actionUrl: `/product/${productId}`
        })
      ]);
    } catch (emailError) {
      console.error('Имэйл илгээхэд алдаа гарлаа:', emailError);
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
    console.error('Алдаа:', error);
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
    checkUserBidStatus
};