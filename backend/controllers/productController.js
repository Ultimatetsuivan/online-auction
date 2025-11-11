const asyncHandler = require("express-async-handler");
const Product = require("../models/product");
const slugify = require("slugify");
const cloudinary = require("cloudinary").v2;
const fs = require('fs');
Product.updateExpiredAuctions();
const postProduct = asyncHandler(async (req, res) => {
    try {
        console.log('Request files:', req.files); // Debug log
        
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
            bidDeadline, 
        } = req.body;
        
        const userId = req.user.id;

        // Validation
        if(!title || !description || !price || !bidDeadline) {
            return res.status(400).json({
                success: false,
                error: "Бүрэн гүйцэд бөглөнө үү"
            });
        }

        const deadlineDate = new Date(bidDeadline);
        if(deadlineDate <= new Date()) {
            return res.status(400).json({
                success: false,
                error: "Дуусах хугацаа ирээдүйн огноо байх ёстой"
            });
        }

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
        // Create product
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
            bidDeadline: deadlineDate,
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
        const products = await Product.find({}).sort("-createdAt").populate("user");
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
      .populate("user");
  
    res.json(products);
  });

const getAllProductsAdmin = async (req, res) => {
    try {
        const products = await Product.find({ user: req.params.userId });
        res.json(products);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
  };


const getProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const product = await Product.findById(id).populate("user");

    if(!product){
        res.status(400);
        throw new Error("Ийм бараа олдсонгүй");
       }
    
       res.status(200).json(product)
});

const getAllSoldProduct = asyncHandler(async (req, res) => {
    const products = await Product.find({ Sold: true}).sort("-createdAt").populate("user");
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
