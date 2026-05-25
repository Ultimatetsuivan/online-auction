// Reset or create admin account
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const ADMIN_CREDENTIALS = {
  email: 'admin@auction.mn',
  password: 'admin123456',
  name: 'Admin',
  role: 'admin'
};

async function resetAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin exists
    let admin = await User.findOne({ email: ADMIN_CREDENTIALS.email });

    if (admin) {
      console.log('📝 Admin user found. Resetting password...');

      // Update admin password
      admin.password = ADMIN_CREDENTIALS.password;
      admin.role = 'admin';
      await admin.save();

      console.log('✅ Admin password has been reset!');
    } else {
      console.log('👤 Creating new admin user...');

      // Create new admin user
      admin = await User.create({
        name: ADMIN_CREDENTIALS.name,
        email: ADMIN_CREDENTIALS.email,
        password: ADMIN_CREDENTIALS.password,
        role: 'admin',
        balance: 0,
        trustScore: 100,
        phoneVerified: true,
        eulaAccepted: true,
        eulaAcceptedAt: new Date(),
        eulaVersion: '1.0'
      });

      console.log('✅ Admin user created successfully!');
    }

    console.log('\n📋 Admin Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email:    ${ADMIN_CREDENTIALS.email}`);
    console.log(`Password: ${ADMIN_CREDENTIALS.password}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 You can now login with these credentials');

    await mongoose.disconnect();
    console.log('\n✅ Done!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    try {
      await mongoose.disconnect();
    } catch (e) {}
    process.exit(1);
  }
}

resetAdmin();
