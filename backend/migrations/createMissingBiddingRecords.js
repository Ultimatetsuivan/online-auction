/**
 * Migration Script: Create missing BiddingProduct records for sold products
 *
 * This script creates BiddingProduct records for products that are marked as sold
 * but don't have corresponding BiddingProduct records. This allows users to see
 * their wins in the "My Wins" section.
 *
 * Run this script once:
 * node migrations/createMissingBiddingRecords.js
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
        const BiddingProduct = mongoose.model('BiddingProduct', new mongoose.Schema({}, { strict: false }));

        // Find all sold products
        const soldProducts = await Product.find({
            sold: true,
            soldTo: { $exists: true, $ne: null }
        }).select('_id title soldTo currentBid price soldAt').lean();

        console.log(`📊 Found ${soldProducts.length} sold products`);

        if (soldProducts.length === 0) {
            console.log('✅ No sold products found. Migration not needed.');
            process.exit(0);
        }

        let created = 0;
        let skipped = 0;

        for (const product of soldProducts) {
            // Check if BiddingProduct record already exists
            const existingBid = await BiddingProduct.findOne({
                user: product.soldTo,
                product: product._id
            });

            if (existingBid) {
                console.log(`   ⏭️  Skipping "${product.title}" - BiddingProduct record already exists`);
                skipped++;
                continue;
            }

            // Create BiddingProduct record
            const bidPrice = product.currentBid || product.price || 0;
            await BiddingProduct.create({
                user: product.soldTo,
                product: product._id,
                price: bidPrice,
                createdAt: product.soldAt || new Date()
            });

            console.log(`   ✅ Created BiddingProduct for "${product.title}" - Price: ${bidPrice}₮`);
            created++;
        }

        console.log('');
        console.log(`✅ Migration completed successfully!`);
        console.log(`   - BiddingProduct records created: ${created}`);
        console.log(`   - Already existing (skipped): ${skipped}`);
        console.log(`   - Total sold products: ${soldProducts.length}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}
