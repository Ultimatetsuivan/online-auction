const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema({
    username:{
        type:String,
        unique: true,
        sparse: true,
    },
    surname:{
        type:String,
    },
    name:{
        type:String,
        require:[true, "Нэрээ заавал бичээрэй"],
    },
    registrationNumber:{
        type:String,
        unique: true,
        sparse: true,
        match: /^УГ\d{8}$/
    },
    email:{
        type:String,
        require:[true, "mail заавал бичээрэй"],
    },
    password:{
        type:String,
        require:[true, "нууц үгээ заавал бичээрэй"],
    },

    photo:{
        filePath: String,
        public_id: String
    },
    phone:{
        type: String,
        unique: true,
        sparse: true,
        match: /^[0-9]{8}$/
    },
    pendingPhone: {
        type: String,
        sparse: true,
        match: /^[0-9]{8}$/
    },
    phoneVerified: {
        type: Boolean,
        default: false
    },
    otpCode: {
        type: String
    },
    otpExpires: {
        type: Date
    },
    otpAttempts: {
        type: Number,
        default: 0
    },
    otpLastAttempt: {
        type: Date
    },
    role:{
        type:String,
        turul: ["admin",  "buyer"],
        default: "buyer",
    },

    googleId: {
        type: String,
        unique: true,
        sparse: true
      },

    // eMongolia integration
    eMongoliaId: {
        type: String,
        unique: true,
        sparse: true
    },
    eMongoliaVerified: {
        type: Boolean,
        default: false
    },
    eMongoliaData: {
        registerNumber: String,
        lastName: String,
        firstName: String,
        dateOfBirth: Date,
        gender: String,
        nationality: String,
        verifiedAt: Date
    },

    balance: {
        type: Number,
        default: 0,
    },

    // FCM tokens for push notifications
    fcmTokens: [{
        type: String
    }],

    // Trust score and reputation
    trustScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    completedDeals: {
        type: Number,
        default: 0
    },
    cancelledBids: {
        type: Number,
        default: 0
    },

    // EULA acceptance
    eulaAccepted: {
        type: Boolean,
        default: false
    },
    eulaAcceptedAt: {
        type: Date
    },
    eulaVersion: {
        type: String
    },

    // ===== Identity Verification (本人確認 - KYC) =====
    identityVerified: {
        type: Boolean,
        default: false
    },
    identityVerification: {
        status: {
            type: String,
            enum: ['none', 'pending', 'approved', 'rejected'],
            default: 'none'
        },
        // ID card photos
        documents: {
            idCardFront: {
                url: String,
                publicId: String
            },
            idCardBack: {
                url: String,
                publicId: String
            },
            selfieWithId: {
                url: String,
                publicId: String
            }
        },
        // ID document details (extracted from images)
        idDetails: {
            fullName: String,
            idNumber: String,
            dateOfBirth: Date,
            nationality: String,
            expiryDate: Date
        },
        // Verification request details
        requestedAt: {
            type: Date
        },
        // Admin review
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        reviewedAt: {
            type: Date
        },
        reviewNotes: {
            type: String,
            trim: true
        },
        rejectionReason: {
            type: String,
            trim: true
        }
    },

    resetPasswordToken: {type: String,},

resetPasswordExpires:{type:Date}
},
{ timeStamp : true }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
    next();
});

// Export model, checking if it already exists to avoid OverwriteModelError
module.exports = mongoose.models.User || mongoose.model("User", userSchema);
