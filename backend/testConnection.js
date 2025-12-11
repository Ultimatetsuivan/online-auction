const mongoose = require('mongoose');
require('dotenv').config();

console.log('Testing MongoDB connection...');
console.log('MONGO_URI:', process.env.MONGO_URI);

const options = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 75000,
  serverApi: {
    version: '1',
    strict: true,
    deprecationErrors: true,
  }
};

mongoose.connect(process.env.MONGO_URI, options)
  .then(async () => {
    console.log('✓ Successfully connected to MongoDB!');
    console.log('✓ Connection state:', mongoose.connection.readyState);
    console.log('✓ Database name:', mongoose.connection.name);

    // Try a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('✓ Collections:', collections.map(c => c.name));

    console.log('\n✓ Connection is working! Press Ctrl+C to exit.');
  })
  .catch(err => {
    console.error('✗ Connection failed:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  });

// Monitor connection events
mongoose.connection.on('connected', () => {
  console.log('EVENT: Connected to MongoDB');
});

mongoose.connection.on('disconnected', () => {
  console.log('EVENT: Disconnected from MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('EVENT: MongoDB error:', err.message);
});
