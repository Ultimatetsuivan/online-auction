const mongoose = require("mongoose");

const depositSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['held', 'returned', 'forfeited'],
        default: 'held'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    releasedAt: {
        type: Date
    },
    reason: {
        type: String
    }
});

// Index for queries
depositSchema.index({ user: 1, product: 1 });
depositSchema.index({ status: 1 });

const Deposit = mongoose.model("Deposit", depositSchema);
module.exports = Deposit;
