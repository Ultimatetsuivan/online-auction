const User = require('../models/User');

// Submit identity verification (本人確認)
exports.submitIdentityVerification = async (req, res) => {
    try {
        const userId = req.user._id;
        const { idCardFront, idCardBack, selfieWithId, idDetails } = req.body;

        // Validate required documents
        if (!idCardFront || !idCardFront.url) {
            return res.status(400).json({
                error: 'Үнэмлэхний урд талын зураг шаардлагатай'
            });
        }

        if (!idCardBack || !idCardBack.url) {
            return res.status(400).json({
                error: 'Үнэмлэхний ар талын зураг шаардлагатай'
            });
        }

        if (!selfieWithId || !selfieWithId.url) {
            return res.status(400).json({
                error: 'Үнэмлэх барьсан селфи зураг шаардлагатай'
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                error: 'Хэрэглэгч олдсонгүй'
            });
        }

        // Check if already verified
        if (user.identityVerified) {
            return res.status(400).json({
                error: 'Таны данс аль хэдийн баталгаажсан байна'
            });
        }

        // Check if verification is pending
        if (user.identityVerification && user.identityVerification.status === 'pending') {
            return res.status(400).json({
                error: 'Таны баталгаажуулалт хүлээгдэж байна'
            });
        }

        // Update user with verification request
        user.identityVerification = {
            status: 'pending',
            documents: {
                idCardFront,
                idCardBack,
                selfieWithId
            },
            idDetails: idDetails || {},
            requestedAt: new Date()
        };

        await user.save();

        res.json({
            success: true,
            message: 'Баталгаажуулалтын хүсэлт илгээгдлээ. 24-48 цагийн дотор хариу ирнэ.',
            user: {
                _id: user._id,
                name: user.name,
                identityVerified: user.identityVerified,
                identityVerification: {
                    status: user.identityVerification.status,
                    requestedAt: user.identityVerification.requestedAt
                }
            }
        });

    } catch (error) {
        console.error('Submit identity verification error:', error);
        res.status(500).json({
            error: 'Баталгаажуулалт илгээхэд алдаа гарлаа',
            details: error.message
        });
    }
};

// Get current user's verification status
exports.getMyVerificationStatus = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId)
            .select('identityVerified identityVerification name email phone');

        if (!user) {
            return res.status(404).json({
                error: 'Хэрэглэгч олдсонгүй'
            });
        }

        res.json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                identityVerified: user.identityVerified,
                identityVerification: user.identityVerification
            }
        });

    } catch (error) {
        console.error('Get verification status error:', error);
        res.status(500).json({
            error: 'Төлөв татахад алдаа гарлаа'
        });
    }
};

// Get all pending identity verifications (Admin only)
exports.getPendingVerifications = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const users = await User.find({
            'identityVerification.status': 'pending'
        })
        .select('name email phone photo identityVerified identityVerification createdAt')
        .sort({ 'identityVerification.requestedAt': 1 }) // Oldest first (FIFO)
        .limit(limit * 1)
        .skip((page - 1) * limit);

        const count = await User.countDocuments({
            'identityVerification.status': 'pending'
        });

        res.json({
            users,
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

// Approve identity verification (Admin only)
exports.approveVerification = async (req, res) => {
    try {
        const { userId } = req.params;
        const { notes } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                error: 'Хэрэглэгч олдсонгүй'
            });
        }

        if (user.identityVerification.status !== 'pending') {
            return res.status(400).json({
                error: 'Баталгаажуулалт хүлээгдэж байхгүй'
            });
        }

        // Update verification status
        user.identityVerified = true;
        user.identityVerification.status = 'approved';
        user.identityVerification.reviewedBy = req.user._id;
        user.identityVerification.reviewedAt = new Date();
        user.identityVerification.reviewNotes = notes;

        // Increase trust score for verified users
        user.trustScore = Math.min(100, user.trustScore + 20);

        await user.save();

        // TODO: Send notification to user

        res.json({
            success: true,
            message: 'Баталгаажуулалт амжилттай',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                identityVerified: user.identityVerified,
                trustScore: user.trustScore
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

// Reject identity verification (Admin only)
exports.rejectVerification = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;

        if (!reason || reason.trim().length === 0) {
            return res.status(400).json({
                error: 'Татгалзсан шалтгаан шаардлагатай'
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                error: 'Хэрэглэгч олдсонгүй'
            });
        }

        if (user.identityVerification.status !== 'pending') {
            return res.status(400).json({
                error: 'Баталгаажуулалт хүлээгдэж байхгүй'
            });
        }

        // Update verification status
        user.identityVerified = false;
        user.identityVerification.status = 'rejected';
        user.identityVerification.reviewedBy = req.user._id;
        user.identityVerification.reviewedAt = new Date();
        user.identityVerification.rejectionReason = reason;

        await user.save();

        // TODO: Send notification to user with rejection reason

        res.json({
            success: true,
            message: 'Баталгаажуулалт татгалзсан',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                identityVerified: user.identityVerified
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

// Get verification statistics (Admin only)
exports.getVerificationStats = async (req, res) => {
    try {
        const totalVerified = await User.countDocuments({ identityVerified: true });
        const totalPending = await User.countDocuments({ 'identityVerification.status': 'pending' });
        const totalRejected = await User.countDocuments({ 'identityVerification.status': 'rejected' });
        const totalUsers = await User.countDocuments({});

        res.json({
            stats: {
                totalUsers,
                verified: totalVerified,
                pending: totalPending,
                rejected: totalRejected,
                unverified: totalUsers - totalVerified - totalPending - totalRejected,
                verificationRate: totalUsers > 0 ? ((totalVerified / totalUsers) * 100).toFixed(1) : 0
            }
        });

    } catch (error) {
        console.error('Get verification stats error:', error);
        res.status(500).json({
            error: 'Статистик татахад алдаа гарлаа'
        });
    }
};
