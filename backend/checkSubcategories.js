require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');

    const vehicleCats = await Category.find({
      $or: [
        { title: 'Cars' },
        { title: 'Car Parts' },
        { title: 'Car Accessories' },
        { title: 'Motorcycles' },
        { title: { $regex: 'Bicycle', $options: 'i' } }
      ]
    }).lean();

    console.log('🚗 Vehicle subcategories in database:\n');
    vehicleCats.forEach(c => {
      console.log(`  ✓ ${c.title} (${c.titleMn})`);
      console.log(`    ID: ${c._id}\n`);
    });

    if (vehicleCats.length === 0) {
      console.log('❌ No vehicle subcategories found!');
      console.log('The AI suggests these names but they don\'t exist in DB:');
      console.log('  - Cars');
      console.log('  - Car Parts');
      console.log('  - Car Accessories');
      console.log('  - Motorcycles');
      console.log('  - Bicycle & Scooters');
    }

    process.exit(0);
  });
