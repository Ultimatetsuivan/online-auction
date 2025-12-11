require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');

    // Find all vehicle products (those with VIN)
    const cars = await Product.find({ vin: { $exists: true } })
      .select('title category brand make model year')
      .lean();

    console.log(`Found ${cars.length} vehicle products:\n`);

    if (cars.length === 0) {
      console.log('❌ No vehicle products found in database!');
      console.log('The seeder may not have run successfully.\n');
    } else {
      cars.forEach((car, index) => {
        console.log(`${index + 1}. ${car.title}`);
        console.log(`   Category: ${car.category || 'NOT SET'}`);
        console.log(`   Brand: ${car.brand}`);
        console.log(`   Make/Model: ${car.make} ${car.model} (${car.year})`);
        console.log('');
      });
    }

    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
