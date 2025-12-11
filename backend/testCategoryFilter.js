require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const Category = require('./models/Category');

const testCategoryFilter = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const parentCategoryId = '6937c7348d86664d36336016'; // Vehicles & Parts
    const carsCategoryId = '6937c7348d86664d36336018'; // Cars

    console.log('Testing category filter logic...\n');

    // Simulate what the backend will do
    const subcategories = await Category.find({ parent: parentCategoryId }).select('_id title titleMn');

    console.log(`Parent Category: Vehicles & Parts (${parentCategoryId})`);
    console.log(`Found ${subcategories.length} subcategories:\n`);

    subcategories.forEach((sub, index) => {
      console.log(`  ${index + 1}. ${sub.title} (${sub.titleMn}) - ID: ${sub._id}`);
    });

    // Build the query like the backend does
    const categoryIds = [parentCategoryId, ...subcategories.map(sub => sub._id)];
    console.log(`\n📊 Query will search for products in these category IDs:`);
    categoryIds.forEach(id => console.log(`   - ${id}`));

    // Test the query
    const query = {
      available: true,
      sold: false,
      auctionStatus: 'active',
      category: { $in: categoryIds }
    };

    const products = await Product.find(query)
      .populate('category', 'title titleMn')
      .select('title category make model year');

    console.log(`\n✅ Found ${products.length} products:\n`);

    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.title}`);
      console.log(`   Category: ${product.category?.title} (${product.category?.titleMn})`);
      console.log(`   Category ID: ${product.category?._id}`);
      if (product.make) {
        console.log(`   Make/Model: ${product.make} ${product.model} (${product.year})`);
      }
      console.log('');
    });

    // Also test filtering by Cars subcategory directly
    console.log('\n--- Direct Cars Category Filter ---');
    const carsProducts = await Product.find({
      available: true,
      sold: false,
      auctionStatus: 'active',
      category: carsCategoryId
    }).select('title');

    console.log(`✅ Found ${carsProducts.length} products directly in Cars category`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testCategoryFilter();
