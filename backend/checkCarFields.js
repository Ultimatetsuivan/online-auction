require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const car = await Product.findOne({ vin: { $exists: true } }).lean();
    console.log('Sample car product fields:');
    console.log(JSON.stringify({
      make: car.make,
      model: car.model,
      year: car.year,
      mileage: car.mileage,
      transmission: car.transmission,
      fuelType: car.fuelType,
      vehicleTitle: car.vehicleTitle,
      vin: car.vin
    }, null, 2));
    process.exit(0);
  });
