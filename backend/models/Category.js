const mongoose = require("mongoose");

const categorySchema = mongoose.Schema({
    user: {
          type: mongoose.Schema.Types.ObjectId,
          require: false,
          ref: "User",
        },
    title: {
        type: String,
        required: [true, "Категорийн нэр шаардлагатай"],
        trim: true
    },
    titleMn: {
        type: String,
        trim: true
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    icon: {
        type: String, // Ionicons name
        default: "cube-outline"
    },
    image: {
        type: String, // Image URL
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        default: null
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    productCount: {
        type: Number,
        default: 0
    },
    // ── Category-specific field definitions ──────────────────────────────────
    // Each entry defines one extra field sellers fill in when listing in this category.
    // The same schema drives: add-product form, product detail display, AND search filters.
    fieldSchema: [{
        key:        { type: String, required: true, trim: true },   // stored as itemSpecifics key
        labelMn:    { type: String, required: true, trim: true },   // Mongolian label shown in UI
        type:       { type: String, enum: ['text','number','select','boolean'], default: 'text' },
        required:   { type: Boolean, default: false },
        unit:       { type: String, trim: true },                   // e.g. "км", "м²"
        options:    [{                                              // for select type
            value:   { type: String },
            labelMn: { type: String },
            _id: false
        }],
        filterable:  { type: Boolean, default: false },            // show in search filter bar
        filterType:  { type: String, enum: ['range','select','text','boolean'], default: 'text' },
        filterOrder: { type: Number, default: 0 },                 // order in filter bar
        _id: false
    }]
},
    {
        timestamps: true,
    }
);

// Create slug from title before saving
categorySchema.pre('save', function(next) {
    if (this.isModified('title')) {
        this.slug = this.title.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }
    next();
});

// Export model, checking if it already exists to avoid OverwriteModelError
module.exports = mongoose.models.Category || mongoose.model("Category", categorySchema);