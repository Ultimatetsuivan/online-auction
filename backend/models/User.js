const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema({
    name:{
        type:String,
        require:[true, "Нэрээ заавал бичээрэй"],
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

const User = mongoose.model("User", userSchema)
module.exports = User;
