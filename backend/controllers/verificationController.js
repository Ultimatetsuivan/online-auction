const Product = require('../models/Product');
const crypto = require('crypto');

// Define required verification photos for different categories
const VERIFICATION_REQUIREMENTS = {
    // Luxury items
    'Luxury Handbags': ['front', 'back', 'logo', 'serial', 'hardware', 'stitching', 'tag', 'authentication-card'],
    'Luxury Watches': ['front', 'back', 'clasp', 'serial', 'engraving', 'hallmark', 'authentication-card'],
    'Jewelry': ['front', 'back', 'hallmark', 'engraving', 'authentication-card'],
    'Designer Shoes': ['front', 'side', 'sole', 'insole', 'logo', 'serial', 'made-in-label'],
    'Designer Clothing': ['front', 'back', 'tag', 'made-in-label', 'logo', 'stitching'],
    'Sunglasses': ['front', 'side', 'logo', 'serial', 'engraving', 'made-in-label'],

    // Electronics
    'Smartphones': ['front', 'back', 'serial', 'barcode'],
    'Laptops': ['front', 'back', 'serial', 'barcode'],
    'Cameras': ['front', 'back', 'serial', 'logo'],

    // Default for other categories
    'default': ['front', 'back', 'tag', 'logo']
};

// Get verification requirements for a category
exports.getVerificationRequirements = async (req, res) => {
    try {
        const { category } = req.params;

        const requirements = VERIFICATION_REQUIREMENTS[category] || VERIFICATION_REQUIREMENTS['default'];

        res.json({
            category,
            requiredPhotos: requirements,
            estimatedReviewTime: '48 hours',
            fee: 5000 // ₮5,000 flat fee
        });

    } catch (error) {
        console.error('Get requirements error:', error);
        res.status(500).json({
            error: 'Шаардлага татахад алдаа гарлаа'
        });
    }
};

// Request verification for a product
exports.requestVerification = async (req, res) => {
    try {
        const { productId } = req.params;
        const { photos } = req.body; // Array of { type, url, publicId }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                error: 'Бараа олдсонгүй'
            });
        }

        // Check if user owns the product
        if (product.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                error: 'Зөвхөн бараагаа баталгаажуулах боломжтой'
            });
        }

        // Check if already verified
        if (product.verified) {
            return res.status(400).json({
                error: 'Бараа аль хэдийн баталгаажсан байна'
            });
        }

        // Check if verification is pending
        if (product.verification && product.verification.status === 'pending') {
            return res.status(400).json({
                error: 'Баталгаажуулалт хүлээгдэж байна'
            });
        }

        // Get required photos for this category
        const requiredPhotos = VERIFICATION_REQUIREMENTS[product.category] || VERIFICATION_REQUIREMENTS['default'];

        // Validate that all required photos are provided
        const providedTypes = photos.map(p => p.type);
        const missingPhotos = requiredPhotos.filter(req => !providedTypes.includes(req));

        if (missingPhotos.length > 0) {
            return res.status(400).json({
                error: 'Шаардлагатай зургууд дутуу байна',
                missingPhotos
            });
        }

        // Mark photos as required
        const verificationPhotos = photos.map(photo => ({
            type: photo.type,
            url: photo.url,
            publicId: photo.publicId,
            required: requiredPhotos.includes(photo.type)
        }));

        // Update product with verification request
        product.verification = {
            status: 'pending',
            photos: verificationPhotos,
            requestedAt: new Date(),
            badgeType: 'basic' // Default badge type
        };

        await product.save();

        res.json({
            success: true,
            message: 'Баталгаажуулалтын хүсэлт илгээгдлээ',
            estimatedReviewTime: '48 hours',
            product: {
                _id: product._id,
                title: product.title,
                verification: product.verification
            }
        });

    } catch (error) {
        console.error('Request verification error:', error);
        res.status(500).json({
            error: 'Баталгаажуулалт хүсэхэд алдаа гарлаа',
            details: error.message
        });
    }
};

// Get all pending verifications (Admin only)
exports.getPendingVerifications = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const products = await Product.find({
            'verification.status': 'pending'
        })
        .populate('user', 'name email phone photo trustScore')
        .sort({ 'verification.requestedAt': 1 }) // Oldest first (FIFO)
        .limit(limit * 1)
        .skip((page - 1) * limit);

        const count = await Product.countDocuments({
            'verification.status': 'pending'
        });

        res.json({
            products,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });

    } catch (error) {
        console.error('Get pending verifications error:', error);
        res.status(500).json({
            error: 'Хүлээгдэж буй баталгаажуулалт татахад алдаа гарлаа'
        });
    }
};

// Approve verification (Admin only)
exports.approveVerification = async (req, res) => {
    try {
        const { productId } = req.params;
        const { badgeType = 'basic', issueCertificate = false, notes } = req.body;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                error: 'Бараа олдсонгүй'
            });
        }

        if (product.verification.status !== 'pending') {
            return res.status(400).json({
                error: 'Баталгаажуулалт хүлээгдэж байхгүй'
            });
        }

        // Generate certificate number if requested
        let certificateNumber = null;
        if (issueCertificate) {
            certificateNumber = `AUTH-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        }

        // Update verification status
        product.verified = true;
        product.verification.status = 'approved';
        product.verification.reviewedBy = req.user._id;
        product.verification.reviewedAt = new Date();
        product.verification.reviewNotes = notes;
        product.verification.badgeType = badgeType;
        product.verification.certificateIssued = issueCertificate;
        product.verification.certificateNumber = certificateNumber;

        await product.save();

        // TODO: Send notification to seller

        res.json({
            success: true,
            message: 'Баталгаажуулалт амжилттай',
            product: {
                _id: product._id,
                title: product.title,
                verified: product.verified,
                verification: product.verification
            }
        });

    } catch (error) {
        console.error('Approve verification error:', error);
        res.status(500).json({
            error: 'Баталгаажуулахад алдаа гарлаа',
            details: error.message
        });
    }
};

// Reject verification (Admin only)
exports.rejectVerification = async (req, res) => {
    try {
        const { productId } = req.params;
        const { reason } = req.body;

        if (!reason || reason.trim().length === 0) {
            return res.status(400).json({
                error: 'Татгалзсан шалтгаан шаардлагатай'
            });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                error: 'Бараа олдсонгүй'
            });
        }

        if (product.verification.status !== 'pending') {
            return res.status(400).json({
                error: 'Баталгаажуулалт хүлээгдэж байхгүй'
            });
        }

        // Update verification status
        product.verified = false;
        product.verification.status = 'rejected';
        product.verification.reviewedBy = req.user._id;
        product.verification.reviewedAt = new Date();
        product.verification.reviewNotes = reason;

        await product.save();

        // TODO: Send notification to seller with rejection reason

        res.json({
            success: true,
            message: 'Баталгаажуулалт татгалзсан',
            product: {
                _id: product._id,
                title: product.title,
                verified: product.verified,
                verification: product.verification
            }
        });

    } catch (error) {
        console.error('Reject verification error:', error);
        res.status(500).json({
            error: 'Татгалзахад алдаа гарлаа',
            details: error.message
        });
    }
};

// Get verification certificate
exports.getCertificate = async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId)
            .populate('user', 'name email')
            .populate('verification.reviewedBy', 'name');

        if (!product) {
            return res.status(404).json({
                error: 'Бараа олдсонгүй'
            });
        }

        if (!product.verified || !product.verification.certificateIssued) {
            return res.status(404).json({
                error: 'Гэрчилгээ олдсонгүй'
            });
        }

        res.json({
            certificate: {
                number: product.verification.certificateNumber,
                productId: product._id,
                productTitle: product.title,
                productCategory: product.category,
                brand: product.brand,
                seller: {
                    name: product.user.name,
                    email: product.user.email
                },
                verifiedBy: product.verification.reviewedBy?.name || 'Admin',
                verifiedAt: product.verification.reviewedAt,
                badgeType: product.verification.badgeType,
                issuedAt: product.verification.reviewedAt
            }
        });

    } catch (error) {
        console.error('Get certificate error:', error);
        res.status(500).json({
            error: 'Гэрчилгээ татахад алдаа гарлаа'
        });
    }
};

// Get verification status for a product
exports.getVerificationStatus = async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId)
            .select('verified verification title category');

        if (!product) {
            return res.status(404).json({
                error: 'Бараа олдсонгүй'
            });
        }

        res.json({
            productId: product._id,
            title: product.title,
            category: product.category,
            verified: product.verified,
            verification: product.verification
        });

    } catch (error) {
        console.error('Get verification status error:', error);
        res.status(500).json({
            error: 'Төлөв татахад алдаа гарлаа'
        });
    }
};

module.exports = {
    getVerificationRequirements,
    requestVerification,
    getPendingVerifications,
    approveVerification,
    rejectVerification,
    getCertificate,
    getVerificationStatus
};
