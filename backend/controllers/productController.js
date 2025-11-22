const asyncHandler = require("express-async-handler");
const Product = require("../models/product");
const slugify = require("slugify");
const cloudinary = require("cloudinary").v2;
const fs = require('fs');

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
        const query = { available: true, sold: false }; 
        
        // Handle search
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Handle category filter - fix the query logic
        if (category) {
            query.category = category;
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
    const { 
        title,
        description, 
        price, 
        category, 
        height, 
        length,
        width,
        weight, } = req.body;
   const { id } = req.params;
   const product = await Product.findById(id);


   if(!product){
    res.status(400);
    throw new Error("Ийм бараа олдсонгүй");
   }

   if(product.user?.toString() !== req.user.id) {
    res.status(401);
    throw new Error("алдаа");
   }

   let fileData = [];
   if(req.file) {
       let uploadFile
       try {
           uploadFile = await cloudinary.uploader.upload(req.file.path,{
               folder: "Bidding/Product",
               resource_type: "image",
           });
       }catch(error){
           console.log(error);
           res.status(500);
           throw new Error("Алдаа");

       }
       if(product.images && product.images.public_id) {
        try{
            await cloudinary.uploader.destroy(product.images.public_id)
        }catch(error) {
            console.log(error);
            res.status(500);
            throw new Error("Зургийг устгахад алдаа гарлаа")
        }
       }
    
       fileData = {
           fileName: req.file.originalname,
           filePath: uploadFile.secure_url,   
           fileType: req.file.mimetype,
           public_id: uploadFile.public_id,   
       };
   }

   const updateProduct = await Product.findByIdAndUpdate(
    {
        _id: id,
    },
    {
       title,
       description, 
       price, 
       category, 
       height, 
       length,
       width,
       weight,
       images: Object.keys(fileData).length === 0 ? Product?.images : fileData,
   },{
    new: true,
    runValidators: true,
   }
);
   res.status(201).json(
    updateProduct,
   );
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
}
