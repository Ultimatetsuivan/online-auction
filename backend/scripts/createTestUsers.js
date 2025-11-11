const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');

const testUsers = [
  {
    name: 'Admin User',
    email: 'admin@auction.mn',
    password: 'admin123',
    phone: '99001122',
    phoneVerified: true,
    role: 'admin',
    balance: 1000000,
    trustScore: 100,
    eulaAccepted: true,
    eulaVersion: '1.0'
  },
  {
    name: 'Test Buyer 1',
    email: 'buyer1@test.mn',
    password: 'test123',
    phone: '88001122',
    phoneVerified: true,
    role: 'buyer',
    balance: 500000,
    trustScore: 85,
    completedDeals: 15,
    cancelledBids: 2,
    eulaAccepted: true,
    eulaVersion: '1.0'
  },
  {
    name: 'Test Buyer 2',
    email: 'buyer2@test.mn',
    password: 'test123',
    phone: '77001122',
    phoneVerified: true,
    role: 'buyer',
    balance: 300000,
    trustScore: 65,
    completedDeals: 8,
    cancelledBids: 4,
    eulaAccepted: true,
    eulaVersion: '1.0'
  },
  {
    name: 'Test Seller 1',
    email: 'seller1@test.mn',
    password: 'test123',
    phone: '95001122',
    phoneVerified: true,
    role: 'buyer',
    balance: 750000,
    trustScore: 92,
    completedDeals: 25,
    cancelledBids: 1,
    eulaAccepted: true,
    eulaVersion: '1.0'
  },
  {
    name: 'New User',
    email: 'newuser@test.mn',
    password: 'test123',
    phone: '94001122',
    phoneVerified: false,
    role: 'buyer',
    balance: 0,
    trustScore: 0,
    completedDeals: 0,
    cancelledBids: 0,
    eulaAccepted: false
  }
];

async function createTestUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Clear existing test users
    await User.deleteMany({ email: { $in: testUsers.map(u => u.email) } });
    console.log('✓ Cleared existing test users');

    // Create users
    for (const userData of testUsers) {
      // Don't manually hash - let User model's pre-save hook do it
      const user = await User.create(userData);

      console.log(`✓ Created user: ${user.name} (${user.email}) - Role: ${user.role}`);
    }

    console.log('\n=== Test Users Created Successfully ===\n');
    console.log('Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ADMIN:');
    console.log('  Email: admin@auction.mn');
    console.log('  Password: admin123');
    console.log('  Phone: 99001122');
    console.log('  Balance: 1,000,000₮');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST USERS:');
    console.log('  Buyer 1: buyer1@test.mn / test123 (Phone: 88001122)');
    console.log('  Buyer 2: buyer2@test.mn / test123 (Phone: 77001122)');
    console.log('  Seller 1: seller1@test.mn / test123 (Phone: 95001122)');
    console.log('  New User: newuser@test.mn / test123 (Phone: 94001122)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nPhone Auth Test:');
    console.log('  You can also login with phone numbers:');
    console.log('  - 99001122 (Admin)');
    console.log('  - 88001122 (Buyer 1)');
    console.log('  - 77001122 (Buyer 2)');
    console.log('  - 95001122 (Seller 1)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Database connection closed');
  }
}

// Run the script
createTestUsers();
