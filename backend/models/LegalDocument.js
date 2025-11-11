const mongoose = require("mongoose");

const legalDocumentSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['eula', 'privacy', 'terms'],
        required: true
    },
    version: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    titleMn: {
        type: String
    },
    content: {
        type: String,
        required: true
    },
    contentMn: {
        type: String
    },
    effectiveDate: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure only one active document per type
legalDocumentSchema.index({ type: 1, isActive: 1 });
legalDocumentSchema.index({ type: 1, version: 1 }, { unique: true });

legalDocumentSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const LegalDocument = mongoose.model("LegalDocument", legalDocumentSchema);
module.exports = LegalDocument;
