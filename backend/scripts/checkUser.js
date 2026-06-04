/**
 * Diagnostic script: check a user by email or registrationNumber, and optionally delete them.
 * Usage:
 *   node scripts/checkUser.js email=testuser@gmail.com
 *   node scripts/checkUser.js regnum=УГ99999999
 *   node scripts/checkUser.js email=testuser@gmail.com delete
 *   node scripts/checkUser.js regnum=УГ99999999 delete
 */

const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

async function run() {
  const args = process.argv.slice(2);
  const shouldDelete = args.includes('delete');

  const emailArg = args.find(a => a.startsWith('email='));
  const regnumArg = args.find(a => a.startsWith('regnum='));

  if (!emailArg && !regnumArg) {
    console.log('Usage:');
    console.log('  node scripts/checkUser.js email=testuser@gmail.com');
    console.log('  node scripts/checkUser.js regnum=УГ99999999');
    console.log('  Append "delete" to remove the found user');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✓ Connected to MongoDB\n');

  let user = null;

  if (emailArg) {
    const email = emailArg.split('=')[1].toLowerCase().trim();
    user = await User.findOne({ email });
    console.log(`Email lookup: ${email}`);
  } else {
    const regnum = regnumArg.split('=').slice(1).join('=').trim();
    user = await User.findOne({ registrationNumber: regnum });
    console.log(`RegistrationNumber lookup: ${regnum}`);
  }

  if (!user) {
    console.log('→ No user found.');
  } else {
    console.log('→ Found user:');
    console.log(`   _id:               ${user._id}`);
    console.log(`   name:              ${user.name}`);
    console.log(`   email:             ${user.email}`);
    console.log(`   phone:             ${user.phone || '—'}`);
    console.log(`   registrationNumber: ${user.registrationNumber || '—'}`);
    console.log(`   role:              ${user.role}`);
    console.log(`   createdAt:         ${user.createdAt}`);

    if (shouldDelete) {
      await User.deleteOne({ _id: user._id });
      console.log('\n✓ User deleted.');
    }
  }

  await mongoose.connection.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
