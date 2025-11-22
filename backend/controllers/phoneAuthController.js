const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendOTP } = require('../utils/sms');
const RefreshToken = require('../models/RefreshToken');
const crypto = require('crypto');

// Generate JWT access token (short-lived)
const generateAccessToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '15m' // 15 minutes
    });
};

// Generate refresh token (long-lived)
const generateRefreshToken = () => {
    return crypto.randomBytes(40).toString('hex');
};

// Send OTP to phone number
exports.sendPhoneOTP = async (req, res) => {
    try {
        const { phone } = req.body;

        // Check rate limiting manually (OTP specific)
        const user = await User.findOne({ phone });

        if (user && user.otpLastAttempt) {
            const timeSinceLastAttempt = Date.now() - user.otpLastAttempt.getTime();
            const tenMinutes = 10 * 60 * 1000;

            if (timeSinceLastAttempt < tenMinutes && user.otpAttempts >= 3) {
                const waitTime = Math.ceil((tenMinutes - timeSinceLastAttempt) / 1000 / 60);
                return res.status(429).json({
                    error: `Хэт олон удаа код хүсэлээ. ${waitTime} минутын дараа дахин оролдоно уу`
                });
            }
        }

        // Generate 6-digit OTP
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes

        // Reset attempts if 10 minutes passed
        const resetAttempts = user && user.otpLastAttempt &&
            (Date.now() - user.otpLastAttempt.getTime()) >= 10 * 60 * 1000;

        // Update or create user with OTP
        await User.findOneAndUpdate(
            { phone },
            {
                phone,
                otpCode: code,
                otpExpires: expiresAt,
                $inc: { otpAttempts: resetAttempts ? -user.otpAttempts + 1 : 1 },
                otpLastAttempt: new Date()
            },
            { upsert: true, new: true }
        );

        // Send OTP via SMS
        await sendOTP(phone, code);

        res.json({
            success: true,
            message: 'Баталгаажуулах код илгээгдлээ',
            expiresIn: 180 // seconds
        });

    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({
            error: 'Код илгээхэд алдаа гарлаа',
            details: error.message
        });
    }
};

// Verify OTP and login/register
exports.verifyPhoneOTP = async (req, res) => {
    try {
        const { phone, code } = req.body;

        const user = await User.findOne({ phone });

        if (!user || !user.otpCode || !user.otpExpires) {
            return res.status(400).json({
                error: 'Код олдсонгүй. Дахин илгээнэ үү'
            });
        }

        // Check if OTP expired
        if (user.otpExpires < new Date()) {
            return res.status(400).json({
                error: 'Кодны хугацаа дууссан. Дахин илгээнэ үү'
            });
        }

        // Check if OTP matches
        if (user.otpCode !== code) {
            return res.status(400).json({
                error: 'Код буруу байна'
            });
        }

        // Get active EULA
        const LegalDocument = require('../models/LegalDocument');
        const activeEula = await LegalDocument.findOne({ type: 'eula', isActive: true });

        // Mark phone as verified
        user.phoneVerified = true;
        user.otpCode = undefined;
        user.otpExpires = undefined;
        user.otpAttempts = 0;

        // Auto-accept EULA for phone auth users on login
        if (!user.eulaAccepted && activeEula) {
            user.eulaAccepted = true;
            user.eulaAcceptedAt = new Date();
            user.eulaVersion = activeEula.version;
        }

        await user.save();

        // Generate tokens
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken();

        // Store refresh token
        await RefreshToken.create({
            user: user._id,
            token: refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            createdByIp: req.ip
        });

        // Set refresh token in HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            success: true,
            accessToken,
            user: {
                _id: user._id,
                name: user.name,
                phone: user.phone,
                email: user.email,
                photo: user.photo,
                role: user.role,
                balance: user.balance,
                trustScore: user.trustScore,
                eulaAccepted: user.eulaAccepted
            }
        });

    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({
            error: 'Баталгаажуулахад алдаа гарлаа',
            details: error.message
        });
    }
};

// Request OTP to link phone number to existing account
exports.requestPhoneLink = async (req, res) => {
    try {
        const { phone } = req.body;
        const userId = req.user._id;

        if (!phone || !/^[0-9]{8}$/.test(phone.trim())) {
            return res.status(400).json({
                error: 'D��,D��?D��< D\'��D3D�D��? 8 D_�?D_D��,D_D1 D�D�D1�. �`�?�,D_D1'
            });
        }

        const normalizedPhone = phone.trim();

        const existing = await User.findOne({ phone: normalizedPhone });
        if (existing && existing._id.toString() !== userId.toString()) {
            return res.status(409).json({
                error: 'D-D��? ���,D��?D��< D\'��D3D�D��? D�D��O �.�?D\'D,D1D� D�O_�?�,D3�?D��,�?D1 D�D�D1D�D�'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                error: 'D��?�?�?D3D��?D3�� D_D�D\'�?D_D�D3O_D1'
            });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 3 * 60 * 1000);

        user.pendingPhone = normalizedPhone;
        user.otpCode = code;
        user.otpExpires = expiresAt;
        user.otpAttempts = 0;
        user.otpLastAttempt = new Date();
        await user.save();

        await sendOTP(normalizedPhone, code);

        res.json({
            success: true,
            message: 'D`D��,D�D�D3D�D�D����D�D��. D�D_D\' D,D�D3�?�?D3D\'D��?�?',
            expiresIn: 180
        });

    } catch (error) {
        console.error('Link phone OTP error:', error);
        res.status(500).json({
            error: 'DsD_D\' D,D�D3�?�?�.�?D\' D�D�D\'D�D� D3D��?D�D�D�',
            details: error.message
        });
    }
};

// Verify OTP and attach phone number to current user
exports.verifyPhoneLink = async (req, res) => {
    try {
        const { code } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                error: 'D��?�?�?D3D��?D3�� D_D�D\'�?D_D�D3O_D1'
            });
        }

        if (!user.pendingPhone) {
            return res.status(400).json({
                error: 'D`D��?�?D�D� D�O_�?�,D3�?D3D\'D��?�? ���?�?'
            });
        }

        if (!code || code.length !== 6 || user.otpCode !== code) {
            return res.status(400).json({
                error: 'DsD_D\' D񥟥?���� D�D�D1D�D�'
            });
        }

        if (!user.otpExpires || user.otpExpires < new Date()) {
            return res.status(400).json({
                error: 'DsD_D\' �.��D3D��+D�D� D\'�����?�?D�D�. D"D��.D,D� D,D�D3�?�?D��? O_O_.'
            });
        }

        user.phone = user.pendingPhone;
        user.pendingPhone = undefined;
        user.phoneVerified = true;
        user.otpCode = undefined;
        user.otpExpires = undefined;
        user.otpAttempts = 0;
        await user.save();

        res.json({
            success: true,
            message: 'D��,D��?D��< D\'��D3D�D��? D�D�DD,D��,�,D�D1 �^D,D��?��D��?D3D\'D��?�?',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                phoneVerified: user.phoneVerified,
                photo: user.photo,
                role: user.role,
                balance: user.balance
            }
        });

    } catch (error) {
        console.error('Verify phone link error:', error);
        res.status(500).json({
            error: 'D`O_�?�,D3�?D�D\' D�D�D\'D�D� D3D��?D�D�D�',
            details: error.message
        });
    }
};

// Register with phone number
exports.registerWithPhone = async (req, res) => {
    try {
        const { phone, code, name } = req.body;

        // First verify OTP
        const user = await User.findOne({ phone });

        if (!user || !user.otpCode || !user.otpExpires) {
            return res.status(400).json({
                error: 'Код олдсонгүй. Дахин илгээнэ үү'
            });
        }

        if (user.otpExpires < new Date()) {
            return res.status(400).json({
                error: 'Кодны хугацаа дууссан. Дахин илгээнэ үү'
            });
        }

        if (user.otpCode !== code) {
            return res.status(400).json({
                error: 'Код буруу байна'
            });
        }

        // Get active EULA
        const LegalDocument = require('../models/LegalDocument');
        const activeEula = await LegalDocument.findOne({ type: 'eula', isActive: true });

        // Update user with name and verify phone
        user.name = name;
        user.phoneVerified = true;
        user.otpCode = undefined;
        user.otpExpires = undefined;
        user.otpAttempts = 0;

        // Auto-accept EULA for phone auth users
        if (!user.eulaAccepted && activeEula) {
            user.eulaAccepted = true;
            user.eulaAcceptedAt = new Date();
            user.eulaVersion = activeEula.version;
        }

        await user.save();

        // Generate tokens
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken();

        // Store refresh token
        await RefreshToken.create({
            user: user._id,
            token: refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            createdByIp: req.ip
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(201).json({
            success: true,
            accessToken,
            user: {
                _id: user._id,
                name: user.name,
                phone: user.phone,
                email: user.email,
                photo: user.photo,
                role: user.role,
                balance: user.balance,
                trustScore: user.trustScore,
                eulaAccepted: user.eulaAccepted
            }
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            error: 'Бүртгэлд алдаа гарлаа',
            details: error.message
        });
    }
};

// Refresh access token
exports.refreshAccessToken = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;

        if (!refreshToken) {
            return res.status(401).json({
                error: 'Refresh token олдсонгүй'
            });
        }

        const storedToken = await RefreshToken.findOne({
            token: refreshToken,
            revokedAt: null,
            expiresAt: { $gt: new Date() }
        });

        if (!storedToken) {
            return res.status(403).json({
                error: 'Refresh token хүчингүй байна'
            });
        }

        const newAccessToken = generateAccessToken(storedToken.user);

        res.json({
            success: true,
            accessToken: newAccessToken
        });

    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({
            error: 'Token сэргээхэд алдаа гарлаа',
            details: error.message
        });
    }
};

// Register FCM token
exports.registerFCMToken = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                error: 'FCM token шаардлагатай'
            });
        }

        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { fcmTokens: token }
        });

        res.json({
            success: true,
            message: 'FCM token бүртгэгдлээ'
        });

    } catch (error) {
        console.error('Register FCM token error:', error);
        res.status(500).json({
            error: 'FCM token бүртгэхэд алдаа гарлаа',
            details: error.message
        });
    }
};

// Remove FCM token (on logout)
exports.removeFCMToken = async (req, res) => {
    try {
        const { token } = req.params;

        await User.findByIdAndUpdate(req.user._id, {
            $pull: { fcmTokens: token }
        });

        res.json({
            success: true,
            message: 'FCM token устгагдлаа'
        });

    } catch (error) {
        console.error('Remove FCM token error:', error);
        res.status(500).json({
            error: 'FCM token устгахад алдаа гарлаа',
            details: error.message
        });
    }
};

// Logout (revoke refresh token)
exports.logout = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;

        if (refreshToken) {
            await RefreshToken.findOneAndUpdate(
                { token: refreshToken },
                {
                    revokedAt: new Date(),
                    revokedByIp: req.ip
                }
            );
        }

        res.clearCookie('refreshToken');

        res.json({
            success: true,
            message: 'Гарсан'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            error: 'Гарахад алдаа гарлаа',
            details: error.message
        });
    }
};
