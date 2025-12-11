const asyncHandler = require("express-async-handler");
const Product = require("../models/product");
const Transaction = require("../models/transaction");
const BiddingProduct = require("../models/bidding");
const Deposit = require("../models/Deposit");
const User = require("../models/User");
const Category = require("../models/Category");
const slugify = require("slugify");
const cloudinary = require("cloudinary").v2;
const fs = require('fs');
const { sendPushNotification } = require("../utils/pushNotification");
const { createNotification } = require("./notificationController");
const { returnDeposit } = require("./depositController");
const { updateTrustScore } = require("../utils/trustScore");
const categoryClassifier = require("../utils/aiCategoryClassifier");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Call static methods to update auction statuses
Product.updateExpiredAuctions();
Product.activateScheduledAuctions();

const postProduct = asyncHandler(async (req, res) => {
    try {
        console.log('Request files:', req.files); // Debug log
        console.log('Request body:', req.body); // Debug log

        const {
            title,
            description,
            price,
            category,
            height,
            length,
            width,
            weight,
            bidThreshold,
            reservePrice,
            buyNowPrice,
            minIncrement,
            // New Yahoo Auctions-style fields
            startMode,           // 'immediate' or 'scheduled'
            scheduledDate,       // Date string (YYYY-MM-DD) for scheduled auctions
            scheduledTime,       // Time string (HH:MM) for scheduled auctions
            auctionDuration      // Duration in days
        } = req.body;

        const userId = req.user.id;

        // ===== Basic Validation =====
        if(!title || !description || !price) {
            return res.status(400).json({
                success: false,
                error: "Нэр, тайлбар, үнэ заавал шаardлагатай"
            });
        }

        // Validate auction duration
        if(!auctionDuration || auctionDuration <= 0) {
            return res.status(400).json({
                success: false,
                error: "Аукционы үргэлжлэх хугацааг сонгоно уу"
            });
        }

        // ===== Handle Start Mode =====
        let auctionStart;
        let auctionStatus;
        const now = new Date();

        if(startMode === 'scheduled') {
            // Scheduled start: validate and combine date + time
            if(!scheduledDate || !scheduledTime) {
                return res.status(400).json({
                    success: false,
                    error: "Эхлэх огноо болон цагийг оруулна уу"
                });
            }

            // Combine date and time into single datetime (UTC)
            const dateTimeString = `${scheduledDate}T${scheduledTime}:00`;
            auctionStart = new Date(dateTimeString);

            // Validate that scheduled start is in the future
            if(auctionStart <= now) {
                return res.status(400).json({
                    success: false,
                    error: "Эхлэх огноо ирээдүйд байх ёстой"
                });
            }

            auctionStatus = 'scheduled';
            console.log(`[Create Product] Scheduled auction: starts at ${auctionStart.toISOString()}`);

        } else {
            // Immediate start: auction starts now
            auctionStart = now;
            auctionStatus = 'active';
            console.log(`[Create Product] Immediate auction: starts now`);
        }

        // ===== Calculate Auction End Time =====
        // bidDeadline = auctionStart + duration (in days)
        const durationMs = parseInt(auctionDuration) * 24 * 60 * 60 * 1000;
        const bidDeadline = new Date(auctionStart.getTime() + durationMs);

        console.log(`[Create Product] Auction duration: ${auctionDuration} days`);
        console.log(`[Create Product] Auction ends at: ${bidDeadline.toISOString()}`);
        // ===== End of Start Mode Handling =====

        // Generate unique slug
        const originalSlug = slugify(title, { lower: true, strict: true });
        let slug = originalSlug;
        let suffix = 1;

        let existingProduct;
        do {
            existingProduct = await Product.findOne({ slug });
            if (existingProduct) {
                slug = `${originalSlug}-${suffix}`;
                suffix++;
            }
        } while (existingProduct);

     // Handle file uploads
let fileData = [];
if(req.files && req.files.length > 0) {
  console.log(`Processing ${req.files.length} images`);
  
  for (const file of req.files) {
    try {
      console.log(`Uploading ${file.originalname} to Cloudinary`);
      const uploadFile = await cloudinary.uploader.upload(file.path, {
        folder: "Bidding/Product",
        resource_type: "image",
      });

      fileData.push({
        url: uploadFile.secure_url,
        publicId: uploadFile.public_id,
        isPrimary: fileData.length === 0,
      });

      // Clean up the uploaded file
      try {
        await fs.promises.unlink(file.path);
        console.log(`Successfully uploaded and cleaned up ${file.originalname}`);
      } catch (cleanupError) {
        console.error(`Error cleaning up file ${file.originalname}:`, cleanupError);
      }
    } catch (error) {
      console.error(`Failed to upload ${file.originalname}:`, error);
      
      // Clean up any remaining files
      await Promise.all(req.files.map(async (f) => {
        if (fs.existsSync(f.path)) {
          try {
            await fs.promises.unlink(f.path);
          } catch (err) {
            console.error(`Error cleaning up file ${f.originalname}:`, err);
          }
        }
      }));
      
      return res.status(500).json({
        success: false,
        error: `Image upload failed: ${error.message}`
      });
    }
  }
}
        // Create product with new Yahoo Auctions-style fields
        const product = await Product.create({
            user: userId,
            title,
            slug,
            description,
            price,
            category: category || "General",
            height,
            length,
            width,
            weight,
            bidThreshold: bidThreshold || null,
            reservePrice: reservePrice || null,
            buyNowPrice: buyNowPrice || null,
            minIncrement: minIncrement || 1,
            // New start system fields
            startMode: startMode || 'immediate',
            auctionStart: auctionStart,
            auctionDuration: parseInt(auctionDuration),
            bidDeadline: bidDeadline,
            auctionStatus: auctionStatus,
            available: auctionStatus === 'active', // Only active auctions are available
            images: fileData,
        });

        console.log('Product created successfully:', product._id);
        res.status(201).json({
            success: true,
            data: product,
        });

    } catch (error) {
        console.error('Product creation failed:', error);
        
        if (req.files) {
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
        }

        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});
const getAllProducts = asyncHandler(async (req, res) => {
    try {
        const products = await Product.find({}).sort("-createdAt").populate("user").populate("category");
        res.json(products);
    } catch (error) {
        console.error('Error fetching all products:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Error fetching products"
        });
    }
});
const getAllAvailableProducts = asyncHandler(async (req, res) => {
    try {
        const { search, category, filter } = req.query;
        const query = {
            available: true,
            sold: false,
            auctionStatus: 'active' // Only show active auctions
        }; 
        
        // Handle search
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Handle category filter - include subcategories if filtering by parent
        if (category) {
            // Find subcategories of the selected category
            const subcategories = await Category.find({ parent: category }).select('_id');

            if (subcategories.length > 0) {
                // If category has subcategories, include both parent and all children
                const categoryIds = [category, ...subcategories.map(sub => sub._id)];
                query.category = { $in: categoryIds };
            } else {
                // If no subcategories, just filter by the category itself
                query.category = category;
            }
        }
        
        // Handle filter options
        if (filter === 'ending') {
            const now = new Date();
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            query.bidDeadline = {
                $gte: now,
                $lte: tomorrow
            };
        } else if (filter === 'new') {
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            query.createdAt = { $gte: weekAgo };
        }
        
        const products = await Product.find(query)
            .populate('user', 'name email')
            .populate('category', 'title _id')
            .sort({ createdAt: -1 });
        
        // Return array directly for frontend compatibility
        res.json(products);
    } catch (error) {
        console.error('Error fetching available products:', error);
        res.status(500).json({ 
            success: false,
            message: error.message || "Error fetching available products"
        });
    }
});
const deleteProduct = asyncHandler(async (req, res) => {
   const { id } = req.params;
   const product = await Product.findById(id);

   if(!product){
    res.status(404);
    throw new Error("Ийм бараа олдсонгүй");
   }
   
   // Check if user owns the product or is admin
   if(product.user?.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(403);
    throw new Error("Та энэ барааг устгах эрхгүй байна");
   }

   // Delete all images from Cloudinary
   if(product.images && product.images.length > 0) {
    try{
        const deletePromises = product.images.map(img => {
            if (img.publicId) {
                return cloudinary.uploader.destroy(img.publicId);
            }
            return Promise.resolve();
        });
        await Promise.all(deletePromises);
    }catch(error) {
        console.error('Error deleting images from Cloudinary:', error);
        // Continue with product deletion even if image deletion fails
    }
   }

   await Product.findByIdAndDelete(id);
   res.status(200).json({
       success: true,
       message: "Амжилттай устгагдлаа"
   });
});

const updateProduct = asyncHandler(async (req, res) => {
    try {
        console.log('Update Request files:', req.files);
        console.log('Update Request body:', req.body);

        const { id } = req.params;
        const product = await Product.findById(id);

        if (!product) {
            res.status(400);
            throw new Error("Ийм бараа олдсонгүй");
        }

        if (product.user?.toString() !== req.user.id) {
            res.status(401);
            throw new Error("алдаа");
        }

        // Extract all fields from request body
        const {
            title,
            description,
            price,
            category,
            height,
            length,
            width,
            weight,
            bidThreshold,
            startMode,
            scheduledDate,
            scheduledTime,
            auctionDuration,
            manufacturer,
            model,
            year,
            mileage,
            engineSize,
            fuelType,
            transmission,
            color,
            condition,
            existingImages // JSON string of existing image URLs
        } = req.body;

        // Handle images: combine existing + new uploads
        let finalImages = [];

        // 1. Keep existing images that weren't removed
        if (existingImages) {
            try {
                const existingUrls = JSON.parse(existingImages);
                // Find matching images from product.images
                finalImages = product.images.filter(img =>
                    existingUrls.includes(img.url) || existingUrls.includes(img.filePath)
                );
            } catch (error) {
                console.error('Error parsing existingImages:', error);
            }
        }

        // 2. Upload new images
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                try {
                    const uploadFile = await cloudinary.uploader.upload(file.path, {
                        folder: "Bidding/Product",
                        resource_type: "image",
                    });

                    finalImages.push({
                        fileName: file.originalname,
                        filePath: uploadFile.secure_url,
                        url: uploadFile.secure_url,
                        fileType: file.mimetype,
                        public_id: uploadFile.public_id,
                    });

                    // Delete temp file
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                } catch (error) {
                    console.error('Image upload error:', error);
                }
            }
        }

        // Build update object
        const updateData = {
            title,
            description,
            price,
            category,
            images: finalImages,
        };

        // Add optional fields
        if (height) updateData.height = height;
        if (length) updateData.length = length;
        if (width) updateData.width = width;
        if (weight) updateData.weight = weight;
        if (bidThreshold) updateData.bidThreshold = bidThreshold;

        // Automotive fields
        if (manufacturer) updateData.manufacturer = manufacturer;
        if (model) updateData.model = model;
        if (year) updateData.year = year;
        if (mileage) updateData.mileage = mileage;
        if (engineSize) updateData.engineSize = engineSize;
        if (fuelType) updateData.fuelType = fuelType;
        if (transmission) updateData.transmission = transmission;
        if (color) updateData.color = color;
        if (condition) updateData.condition = condition;

        // Update auction timing if provided
        if (auctionDuration) {
            const durationDays = parseInt(auctionDuration);
            const now = new Date();

            if (startMode === 'scheduled' && scheduledDate && scheduledTime) {
                // Scheduled start
                const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
                updateData.bidStartTime = scheduledDateTime;
                updateData.auctionStatus = 'scheduled';

                // Calculate deadline from scheduled start
                const deadline = new Date(scheduledDateTime);
                deadline.setDate(deadline.getDate() + durationDays);
                updateData.bidDeadline = deadline;
            } else {
                // Immediate start - extend from now
                const newDeadline = new Date(now);
                newDeadline.setDate(newDeadline.getDate() + durationDays);
                updateData.bidDeadline = newDeadline;
                updateData.auctionStatus = 'active';
                updateData.bidStartTime = now;
            }
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            updateData,
            {
                new: true,
                runValidators: true,
            }
        );

        res.status(200).json(updatedProduct);
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500);
        throw error;
    }
});
const getAllProductsUser = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { search } = req.query;
  
    let query = { user: userId };
  
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
  
    const products = await Product.find(query)
      .sort("-createdAt")
      .populate("user")
      .populate("category");
  
    res.json(products);
  });

const buyNowProduct = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.params;

  const product = await Product.findById(productId).populate("user");
  if (!product) {
    return res.status(404).json({ success: false, message: "D~D1D� D�D��?D�D� D_D�D'�?D_D�D3O_D1" });
  }

  if (!product.buyNowPrice) {
    return res.status(400).json({ success: false, message: "Buy now not available for this product" });
  }

  if (product.sold || product.auctionStatus === "ended") {
    return res.status(400).json({ success: false, message: "Auction already ended or sold" });
  }

  if (product.user?._id?.toString() === userId.toString()) {
    return res.status(400).json({ success: false, message: "Seller cannot buy their own product" });
  }

  const buyer = await User.findById(userId);
  if (!buyer) {
    return res.status(404).json({ success: false, message: "Buyer not found" });
  }

  if (buyer.balance < product.buyNowPrice) {
    return res.status(400).json({ success: false, message: "Insufficient balance for buy now" });
  }

  const session = await Product.startSession();
  session.startTransaction();

  try {
    // Deduct from buyer and credit seller
    await User.updateOne({ _id: userId }, { $inc: { balance: -product.buyNowPrice } }).session(session);
    await User.updateOne({ _id: product.user._id }, { $inc: { balance: product.buyNowPrice } }).session(session);

    product.currentBid = product.buyNowPrice;
    product.highestBidder = userId;
    product.sold = true;
    product.soldTo = userId;
    product.available = false;
    product.auctionStatus = "ended";
    await product.save({ session });

    await Transaction.create([{
      buyer: userId,
      seller: product.user._id,
      product: productId,
      amount: product.buyNowPrice
    }], { session });

    await BiddingProduct.create([{
      user: userId,
      product: productId,
      price: product.buyNowPrice
    }], { session });

    await session.commitTransaction();
    session.endSession();

    // Update trust score post-transaction
    await updateTrustScore(userId, 'completed');

    // Return deposits to losing bidders (held deposits not owned by the buyer)
    const loserDeposits = await Deposit.find({ 
      product: productId, 
      status: 'held', 
      user: { $ne: userId }
    });
    await Promise.all(loserDeposits.map(d => returnDeposit(d._id, 'Auction completed via Buy Now')));

    // Notifications
    const primaryImage = product.images?.find?.((img) => img.isPrimary)?.url || product.images?.[0]?.url || null;

    await Promise.all([
      sendPushNotification(userId, {
        title: "Congratulations! You Won!",
        body: `"${product.title}" bought instantly for ${product.buyNowPrice.toLocaleString()}₮`,
        type: "won_auction",
        productId,
        actionUrl: `/products/${productId}`,
        image: primaryImage
      }),
      sendPushNotification(product.user._id, {
        title: "Item Sold!",
        body: `"${product.title}" sold via Buy Now for ${product.buyNowPrice.toLocaleString()}₮`,
        type: "sold",
        productId,
        actionUrl: `/products/${productId}`,
        image: primaryImage
      }),
      createNotification(userId, {
        type: "won_auction",
        productId,
        title: "Congratulations! You Won!",
        message: `"${product.title}" bought instantly for ${product.buyNowPrice.toLocaleString()}₮`,
        actionUrl: `/products/${productId}`
      }),
      createNotification(product.user._id, {
        type: "sold",
        productId,
        title: "Item Sold!",
        message: `"${product.title}" sold via Buy Now for ${product.buyNowPrice.toLocaleString()}₮`,
        actionUrl: `/products/${productId}`
      })
    ]);

    return res.status(200).json({
      success: true,
      productId,
      price: product.buyNowPrice,
      soldTo: userId
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Buy now error:", error);
    return res.status(500).json({ success: false, message: "Failed to complete buy now", error: error.message });
  }
});

const sellNowToTopBidder = asyncHandler(async (req, res) => {
  console.log('=== SELL NOW TO TOP BIDDER CALLED ===');
  const userId = req.user._id;
  const { productId } = req.params;
  console.log('User ID:', userId);
  console.log('Product ID:', productId);

  // Find product and verify ownership
  const product = await Product.findById(productId).populate("user");
  if (!product) {
    console.log('ERROR: Product not found');
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  console.log('Product found:', {
    title: product.title,
    sold: product.sold,
    auctionStatus: product.auctionStatus,
    currentBid: product.currentBid
  });

  // Verify the seller is the owner
  if (product.user?._id?.toString() !== userId.toString()) {
    console.log('ERROR: User not authorized');
    return res.status(403).json({ success: false, message: "You are not authorized to sell this product" });
  }

  // Check if already sold
  if (product.sold || product.auctionStatus === "ended") {
    console.log('ERROR: Product already sold or ended');
    return res.status(400).json({ success: false, message: "Product is already sold or auction has ended" });
  }

  // Find all bids sorted by price (highest first)
  const allBids = await BiddingProduct.find({ product: productId })
    .sort({ price: -1, createdAt: -1 })
    .populate("user");

  if (!allBids || allBids.length === 0) {
    console.log('ERROR: No bids found');
    return res.status(400).json({ success: false, message: "No bids found. Cannot sell to top bidder." });
  }

  console.log(`Found ${allBids.length} bids, checking for bidders with sufficient balance...`);

  // Find the first bidder with sufficient balance
  let topBid = null;
  let buyer = null;
  let skippedBidders = [];

  for (const bid of allBids) {
    if (!bid.user) {
      console.log('Skipping bid with no user');
      continue;
    }

    const potentialBuyer = await User.findById(bid.user._id);
    if (!potentialBuyer) {
      console.log(`Skipping bid - user ${bid.user.name} not found`);
      skippedBidders.push({ name: bid.user.name, price: bid.price, reason: 'User not found' });
      continue;
    }

    if (potentialBuyer.balance >= bid.price) {
      // Found a bidder with sufficient balance!
      topBid = bid;
      buyer = potentialBuyer;
      console.log(`Selected bidder: ${buyer.name}, Balance: ${buyer.balance}₮, Bid: ${bid.price}₮`);
      break;
    } else {
      console.log(`Skipping ${potentialBuyer.name} - Insufficient balance (Has: ${potentialBuyer.balance}₮, Needs: ${bid.price}₮)`);
      skippedBidders.push({
        name: potentialBuyer.name,
        price: bid.price,
        balance: potentialBuyer.balance,
        reason: 'Insufficient balance'
      });
    }
  }

  if (!topBid || !buyer) {
    console.log('ERROR: No bidders with sufficient balance');
    let errorMessage = "No bidders have sufficient balance to complete the sale.";
    if (skippedBidders.length > 0) {
      errorMessage += `\n\nSkipped bidders:\n${skippedBidders.map(b =>
        `- ${b.name}: ${b.price}₮ (${b.reason}${b.balance !== undefined ? `, has ${b.balance}₮` : ''})`
      ).join('\n')}`;
    }
    return res.status(400).json({
      success: false,
      message: errorMessage,
      skippedBidders: skippedBidders
    });
  }

  const buyerId = buyer._id;
  const salePrice = topBid.price;

  console.log('Final selection:', {
    bidder: buyer.name,
    price: salePrice,
    balance: buyer.balance,
    skippedCount: skippedBidders.length
  });

  console.log('Starting transaction...');
  const session = await Product.startSession();
  session.startTransaction();

  try {
    console.log('Transferring funds...');
    // Transfer funds from buyer to seller
    await User.updateOne({ _id: buyerId }, { $inc: { balance: -salePrice } }).session(session);
    await User.updateOne({ _id: userId }, { $inc: { balance: salePrice } }).session(session);

    console.log('Marking product as sold...');
    // Mark product as sold
    product.currentBid = salePrice;
    product.highestBidder = buyerId;
    product.sold = true;
    product.soldTo = buyerId;
    product.soldAt = new Date();
    product.available = false;
    product.auctionStatus = "ended";

    console.log('Saving product with values:', {
      sold: product.sold,
      auctionStatus: product.auctionStatus,
      available: product.available
    });

    await product.save({ session });

    console.log('Product saved successfully');

    // Create transaction record
    await Transaction.create([{
      buyer: buyerId,
      seller: userId,
      product: productId,
      amount: salePrice
    }], { session });

    console.log('Committing transaction...');
    await session.commitTransaction();
    session.endSession();
    console.log('Transaction committed successfully');

    // Update trust scores
    await updateTrustScore(buyerId, 'completed');
    await updateTrustScore(userId, 'completed');

    // Return deposits to losing bidders
    const loserDeposits = await Deposit.find({
      product: productId,
      status: 'held',
      user: { $ne: buyerId }
    });
    await Promise.all(loserDeposits.map(d => returnDeposit(d._id, 'Auction ended early by seller')));

    // Notifications
    const primaryImage = product.images?.find?.((img) => img.isPrimary)?.url || product.images?.[0]?.url || null;

    await Promise.all([
      sendPushNotification(buyerId, {
        title: "Congratulations! You won!",
        body: `"${product.title}" sold to you for $${salePrice.toLocaleString()}`,
        type: "won_auction",
        productId,
        actionUrl: `/products/${productId}`,
        image: primaryImage
      }),
      sendPushNotification(userId, {
        title: "Item Sold!",
        body: `"${product.title}" sold to top bidder for $${salePrice.toLocaleString()}`,
        type: "sold",
        productId,
        actionUrl: `/products/${productId}`,
        image: primaryImage
      }),
      createNotification(buyerId, {
        type: "won_auction",
        productId,
        title: "You Won!",
        message: `"${product.title}" sold to you for $${salePrice.toLocaleString()}`,
        actionUrl: `/products/${productId}`
      }),
      createNotification(userId, {
        type: "sold",
        productId,
        title: "Item Sold",
        message: `"${product.title}" sold to top bidder for $${salePrice.toLocaleString()}`,
        actionUrl: `/products/${productId}`
      })
    ]);

    // Fetch updated product with populated fields
    console.log('Fetching updated product...');
    const updatedProduct = await Product.findById(productId)
      .populate('user')
      .populate('category')
      .populate('soldTo');

    console.log('Updated product status:', {
      sold: updatedProduct.sold,
      auctionStatus: updatedProduct.auctionStatus,
      available: updatedProduct.available
    });

    console.log('=== SELL NOW COMPLETED SUCCESSFULLY ===');

    let successMessage = `Successfully sold to ${buyer.name} for $${salePrice.toLocaleString()}`;
    if (skippedBidders.length > 0) {
      successMessage += ` (Skipped ${skippedBidders.length} bidder${skippedBidders.length > 1 ? 's' : ''} with insufficient balance)`;
    }

    return res.status(200).json({
      success: true,
      sold: true,
      productId,
      price: salePrice,
      soldTo: buyerId,
      buyerName: buyer.name,
      product: updatedProduct,
      message: successMessage,
      skippedBidders: skippedBidders
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Sell now error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to complete instant sale",
      error: error.message
    });
  }
});

const getMyActiveAuctions = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const products = await Product.find({
    user: userId,
    auctionStatus: 'active',
    sold: false
  })
  .sort("-createdAt")
  .populate("category");

  res.json(products);
});

const getMyScheduledAuctions = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const products = await Product.find({ 
    user: userId, 
    auctionStatus: 'scheduled'
  })
  .sort("-createdAt")
  .populate("category");

  res.json(products);
});

const getMyEndedUnsoldAuctions = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const products = await Product.find({ 
    user: userId, 
    auctionStatus: 'ended',
    sold: false
  })
  .sort("-createdAt")
  .populate("category");

  res.json(products);
});

const getMySoldAuctions = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const products = await Product.find({ 
    user: userId, 
    sold: true
  })
  .sort("-createdAt")
  .populate("category");

  res.json(products);
});

const getAllProductsAdmin = async (req, res) => {
    try {
        const products = await Product.find({ user: req.params.userId }).populate("category");
        res.json(products);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
  };


const getProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const product = await Product.findById(id).populate("user").populate("category");

    if(!product){
        res.status(400);
        throw new Error("Ийм бараа олдсонгүй");
       }

       res.status(200).json(product)
});

const getAllSoldProduct = asyncHandler(async (req, res) => {
    const products = await Product.find({ Sold: true}).sort("-createdAt").populate("user").populate("category");
    res.json(products);
});

// Get similar products based on category and price range
const getSimilarProducts = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const limit = parseInt(req.query.limit) || 10;

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Бүтээгдэхүүн олдсонгүй"
            });
        }

        // Calculate price range (±30%)
        const minPrice = product.price * 0.7;
        const maxPrice = product.price * 1.3;

        // Find similar products
        const similarProducts = await Product.find({
            _id: { $ne: id }, // Exclude current product
            category: product.category,
            price: { $gte: minPrice, $lte: maxPrice },
            available: true,
            sold: false,
            auctionStatus: 'active'
        })
        .populate('user', 'name photo')
        .populate('category', 'title')
        .sort({ createdAt: -1 })
        .limit(limit);

        res.json({
            success: true,
            count: similarProducts.length,
            products: similarProducts
        });

    } catch (error) {
        console.error('Get similar products error:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Алдаа гарлаа"
        });
    }
});

// Get recommended products for a user
const getRecommendedProducts = asyncHandler(async (req, res) => {
    try {
        const userId = req.user?._id;
        const limit = parseInt(req.query.limit) || 20;

        let query = {
            available: true,
            sold: false,
            auctionStatus: 'active'
        };

        // If user is authenticated, exclude their own products
        if (userId) {
            query.user = { $ne: userId };
        }

        // Basic recommendation: mix of new listings and ending soon
        const newProducts = await Product.find(query)
            .populate('user', 'name photo')
            .populate('category', 'title')
            .sort({ createdAt: -1 })
            .limit(Math.floor(limit / 2));

        const endingSoonProducts = await Product.find({
            ...query,
            bidDeadline: {
                $gte: new Date(),
                $lte: new Date(Date.now() + 48 * 60 * 60 * 1000) // Next 48 hours
            }
        })
        .populate('user', 'name photo')
        .populate('category', 'title')
        .sort({ bidDeadline: 1 })
        .limit(Math.floor(limit / 2));

        // Combine and remove duplicates
        const productMap = new Map();
        [...newProducts, ...endingSoonProducts].forEach(p => {
            productMap.set(p._id.toString(), p);
        });

        const recommendedProducts = Array.from(productMap.values()).slice(0, limit);

        res.json({
            success: true,
            count: recommendedProducts.length,
            products: recommendedProducts
        });

    } catch (error) {
        console.error('Get recommended products error:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Алдаа гарлаа"
        });
    }
});

// ===== NEW: Vehicle-Specific Endpoints =====

// Update vehicle information
const updateVehicleInfo = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const {
            vin,
            make,
            model,
            year,
            mileage,
            transmission,
            fuelType,
            vehicleTitle,
            itemSpecifics
        } = req.body;

        // Find product
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Check ownership
        if (product.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update this product"
            });
        }

        // Update vehicle fields
        if (vin) product.vin = vin.toUpperCase();
        if (make) product.make = make;
        if (model) product.model = model;
        if (year) product.year = year;
        if (mileage !== undefined) product.mileage = mileage;
        if (transmission) product.transmission = transmission;
        if (fuelType) product.fuelType = fuelType;
        if (vehicleTitle) product.vehicleTitle = vehicleTitle;

        // Update item specifics (Map)
        if (itemSpecifics && typeof itemSpecifics === 'object') {
            product.itemSpecifics = new Map(Object.entries(itemSpecifics));
        }

        await product.save();

        res.status(200).json({
            success: true,
            message: "Vehicle information updated successfully",
            data: product
        });
    } catch (error) {
        console.error('Update vehicle info error:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update vehicle information"
        });
    }
});

// Update seller description (Rich HTML)
const updateSellerDescription = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { sellerDescription } = req.body;

        // Find product
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Check ownership
        if (product.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update this product"
            });
        }

        // Update seller description
        product.sellerDescription = sellerDescription;
        await product.save();

        res.status(200).json({
            success: true,
            message: "Seller description updated successfully",
            data: product
        });
    } catch (error) {
        console.error('Update seller description error:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update seller description"
        });
    }
});

// Decode VIN (Basic implementation - can be enhanced with external API)
const decodeVIN = asyncHandler(async (req, res) => {
    try {
        const { vin } = req.params;

        // Basic VIN validation
        if (!vin || vin.length !== 17) {
            return res.status(400).json({
                success: false,
                message: "Invalid VIN. VIN must be 17 characters."
            });
        }

        // VIN character validation (no I, O, Q allowed)
        const invalidChars = /[IOQ]/i;
        if (invalidChars.test(vin)) {
            return res.status(400).json({
                success: false,
                message: "Invalid VIN. VIN cannot contain I, O, or Q."
            });
        }

        // Basic VIN decoding (position-based)
        const vinUpper = vin.toUpperCase();

        // World Manufacturer Identifier (WMI) - first 3 characters
        const wmi = vinUpper.substring(0, 3);

        // Vehicle Descriptor Section (VDS) - characters 4-8
        const vds = vinUpper.substring(3, 8);

        // Check digit - character 9
        const checkDigit = vinUpper[8];

        // Vehicle Identifier Section (VIS) - characters 10-17
        const vis = vinUpper.substring(9);

        // Model year (character 10)
        const yearCode = vinUpper[9];
        const yearMap = {
            'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014,
            'F': 2015, 'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019,
            'L': 2020, 'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024,
            'S': 2025, 'T': 2026, 'V': 2027, 'W': 2028, 'X': 2029,
            'Y': 2030
        };

        // Basic manufacturer detection
        let manufacturer = 'Unknown';
        if (wmi.startsWith('1') || wmi.startsWith('4') || wmi.startsWith('5')) {
            manufacturer = 'United States';
        } else if (wmi.startsWith('2')) {
            manufacturer = 'Canada';
        } else if (wmi.startsWith('3')) {
            manufacturer = 'Mexico';
        } else if (wmi.startsWith('J')) {
            manufacturer = 'Japan';
        } else if (wmi.startsWith('K')) {
            manufacturer = 'South Korea';
        } else if (wmi.startsWith('W')) {
            manufacturer = 'Germany';
        }

        // Common manufacturer codes
        const manufacturerCodes = {
            '1FA': 'Ford (USA)',
            '1FB': 'Ford (USA)',
            '1FT': 'Ford Truck (USA)',
            '1G': 'General Motors',
            '1GC': 'Chevrolet Truck',
            '1HC': 'Honda (USA)',
            '2HG': 'Honda (Canada)',
            '3VW': 'Volkswagen (Mexico)',
            '5YJ': 'Tesla',
            'JM': 'Mazda',
            'JT': 'Toyota',
            'KM': 'Hyundai',
            'WAU': 'Audi',
            'WBA': 'BMW',
            'WDB': 'Mercedes-Benz',
            'WP0': 'Porsche'
        };

        // Check for specific manufacturer
        for (const [code, name] of Object.entries(manufacturerCodes)) {
            if (vinUpper.startsWith(code)) {
                manufacturer = name;
                break;
            }
        }

        const decodedInfo = {
            vin: vinUpper,
            wmi: wmi,
            manufacturer: manufacturer,
            modelYear: yearMap[yearCode] || 'Unknown',
            checkDigit: checkDigit,
            serialNumber: vis.substring(5), // Last 6 digits
            isValid: true
        };

        res.status(200).json({
            success: true,
            message: "VIN decoded successfully",
            data: decodedInfo,
            note: "This is a basic VIN decoder. For comprehensive vehicle information, integrate with NHTSA or commercial VIN API services."
        });
    } catch (error) {
        console.error('VIN decode error:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to decode VIN"
        });
    }
});

// Request Vehicle History Report
const requestVehicleHistory = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { provider, reportUrl } = req.body;

        // Find product
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Check ownership
        if (product.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update this product"
            });
        }

        // Check if product has VIN
        if (!product.vin) {
            return res.status(400).json({
                success: false,
                message: "Product must have a VIN to request vehicle history report"
            });
        }

        // Update vehicle history report
        product.vehicleHistoryReport = {
            available: reportUrl ? true : false,
            provider: provider || 'AutoCheck',
            reportUrl: reportUrl || null,
            unavailableReasons: reportUrl ? [] : [
                "Report not yet generated",
                "Please upload report URL or contact support"
            ]
        };

        await product.save();

        res.status(200).json({
            success: true,
            message: "Vehicle history report updated successfully",
            data: product.vehicleHistoryReport,
            note: "To integrate with Carfax/AutoCheck API, you need to sign up for their commercial API services and add API keys to .env file"
        });
    } catch (error) {
        console.error('Vehicle history update error:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update vehicle history report"
        });
    }
});

// ===== End Vehicle Endpoints =====

// ===== AI Category Suggestion =====

// Suggest category based on title and description
const suggestCategory = asyncHandler(async (req, res) => {
    try {
        const { title, description, useAI } = req.body;

        if (!title || title.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Product title is required"
            });
        }

        let result;

        // Use AI (OpenAI) if requested and API key available
        if (useAI && process.env.OPENAI_API_KEY) {
            result = await categoryClassifier.classifyWithAI(title, description || '');
        } else {
            // Use rule-based classifier (free, works offline)
            result = categoryClassifier.classify(title, description || '');
        }

        res.status(200).json({
            success: true,
            message: "Category suggested successfully",
            data: result,
            availableCategories: categoryClassifier.getAvailableCategories()
        });
    } catch (error) {
        console.error('Category suggestion error:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to suggest category"
        });
    }
});

// ===== End AI Category Suggestion =====

module.exports = {
    postProduct,
    getAllProducts,
    deleteProduct,
    updateProduct,
    getAllProductsUser,
    getProduct,
    getAllSoldProduct,
    getAllAvailableProducts,
    getAllProductsAdmin,
    getMyActiveAuctions,
    getMyScheduledAuctions,
    getMyEndedUnsoldAuctions,
    getMySoldAuctions,
    buyNowProduct,
    sellNowToTopBidder,
    getSimilarProducts,
    getRecommendedProducts,
    // New vehicle endpoints
    updateVehicleInfo,
    updateSellerDescription,
    decodeVIN,
    requestVehicleHistory,
    // AI category suggestion
    suggestCategory
}
