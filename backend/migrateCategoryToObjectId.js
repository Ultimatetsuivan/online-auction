require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const Category = require('./models/Category');

/**
 * Migration Script: Convert Product category field from String to ObjectId
 *
 * This script migrates existing products that have category as a string value
 * to use the proper ObjectId reference to the Category collection.
 */

const migrateCategories = async () => {
  try {
    console.log('🚀 Starting Category Migration...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all categories for lookup
    const categories = await Category.find({}).lean();
    console.log(`✅ Found ${categories.length} categories in database\n`);

    // Create a map of category titles to IDs (both English and Mongolian)
    const categoryMap = new Map();
    categories.forEach(cat => {
      // Add by English title
      if (cat.title) {
        categoryMap.set(cat.title.toLowerCase(), cat._id);
      }
      // Add by Mongolian title
      if (cat.titleMn) {
        categoryMap.set(cat.titleMn.toLowerCase(), cat._id);
      }
    });

    // Find all products
    const products = await Product.find({}).lean();
    console.log(`✅ Found ${products.length} total products\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const unmatchedCategories = new Set();

    console.log('Starting migration...\n');

    for (const product of products) {
      try {
        // Check if category is already an ObjectId
        if (mongoose.Types.ObjectId.isValid(product.category) &&
            typeof product.category === 'object') {
          skippedCount++;
          continue;
        }

        // If category is a string, try to find matching category
        if (typeof product.category === 'string') {
          const categoryTitle = product.category.toLowerCase();
          const categoryId = categoryMap.get(categoryTitle);

          if (categoryId) {
            // Update the product with the ObjectId
            await Product.updateOne(
              { _id: product._id },
              { $set: { category: categoryId } }
            );
            migratedCount++;
            console.log(`✅ Migrated: "${product.title}" → Category: "${product.category}"`);
          } else {
            // Category string doesn't match any existing category
            unmatchedCategories.add(product.category);
            errorCount++;
            console.log(`❌ No match found for: "${product.title}" → Category: "${product.category}"`);
          }
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error migrating product ${product._id}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Successfully migrated: ${migratedCount} products`);
    console.log(`⏭️  Skipped (already ObjectId): ${skippedCount} products`);
    console.log(`❌ Errors/Unmatched: ${errorCount} products`);
    console.log(`📦 Total products: ${products.length}`);

    if (unmatchedCategories.size > 0) {
      console.log('\n⚠️  Unmatched category strings:');
      unmatchedCategories.forEach(cat => {
        console.log(`   - "${cat}"`);
      });
      console.log('\nThese products will need manual category assignment.');
    }

    console.log('='.repeat(60));
    console.log('\n✅ Migration completed!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error during migration:', error);
    process.exit(1);
  }
};

// Run the migration
migrateCategories();
