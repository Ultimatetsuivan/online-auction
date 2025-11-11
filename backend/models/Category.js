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
    }
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

const Category = mongoose.model("Category", categorySchema);
module.exports = Category;