/**
 * Migration Script: Add sellType field to existing products
 *
 * This script adds the sellType field to all existing products in the database
 * that don't already have it, defaulting to 'auction' for backward compatibility.
 *
 * Run this script once after deploying the sellType feature:
 * node migrations/addSellTypeToProducts.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ Connected to MongoDB');
    runMigration();
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

async function runMigration() {
    try {
        const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

        // Find all products without sellType field
        const productsWithoutSellType = await Product.countDocuments({
            sellType: { $exists: false }
        });

        console.log(`📊 Found ${productsWithoutSellType} products without sellType field`);

        if (productsWithoutSellType === 0) {
            console.log('✅ All products already have sellType field. No migration needed.');
            process.exit(0);
        }

        // Update all products without sellType to have sellType='auction'
        const result = await Product.updateMany(
            { sellType: { $exists: false } },
            { $set: { sellType: 'auction' } }
        );

        console.log(`✅ Migration completed successfully!`);
        console.log(`   - Products updated: ${result.modifiedCount}`);
        console.log(`   - Default sellType: 'auction'`);

        // Verify the migration
        const remainingWithoutSellType = await Product.countDocuments({
            sellType: { $exists: false }
        });

        if (remainingWithoutSellType === 0) {
            console.log('✅ Verification passed: All products now have sellType field');
        } else {
            console.log(`⚠️  Warning: ${remainingWithoutSellType} products still missing sellType`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}
