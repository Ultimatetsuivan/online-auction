require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const Category = require('./models/Category');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');

    // Find the Cars category
    const carsCategory = await Category.findOne({ title: 'Cars' });
    console.log('🚗 Cars Category:');
    console.log(`   Title: ${carsCategory.title} (${carsCategory.titleMn})`);
    console.log(`   ID: ${carsCategory._id}\n`);

    // Find vehicle products with populated category
    const vehicleProducts = await Product.find({ vin: { $exists: true } })
      .populate('category')
      .select('title category brand make model year')
      .lean();

    console.log(`Found ${vehicleProducts.length} vehicle products:\n`);

    vehicleProducts.forEach((car, index) => {
      console.log(`${index + 1}. ${car.title}`);
      console.log(`   Category ID: ${car.category?._id}`);
      console.log(`   Category: ${car.category?.title} (${car.category?.titleMn})`);
      console.log(`   Make/Model: ${car.make} ${car.model} (${car.year})`);

      // Check if category matches Cars category
      const isCorrect = car.category?._id?.toString() === carsCategory._id.toString();
      console.log(`   ✅ Correctly categorized: ${isCorrect ? 'YES' : 'NO'}`);
      console.log('');
    });

    // Count products in Cars category
    const carsCount = await Product.countDocuments({ category: carsCategory._id });
    console.log(`\n📊 Total products in "Cars" category: ${carsCount}`);

    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
