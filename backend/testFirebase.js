require('dotenv').config();
const { initializeFirebase, getMessaging } = require('./config/firebase');

console.log('\n=== Testing Firebase Configuration ===\n');

// Log environment variables (hiding sensitive data)
console.log('1. Checking environment variables:');
console.log('   FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID || 'NOT SET');
console.log('   FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL || 'NOT SET');
console.log('   FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? 'SET (hidden)' : 'NOT SET');
console.log('');

// Test Firebase initialization
console.log('2. Initializing Firebase...');
const app = initializeFirebase();

if (!app) {
    console.log('   ❌ Firebase initialization failed!');
    console.log('   Check the error messages above.');
    process.exit(1);
}

console.log('   ✅ Firebase initialized successfully!');
console.log('');

// Test getting messaging instance
console.log('3. Testing Firebase Messaging...');
const messaging = getMessaging();

if (!messaging) {
    console.log('   ❌ Failed to get Firebase Messaging instance');
    process.exit(1);
}

console.log('   ✅ Firebase Messaging is ready!');
console.log('');

console.log('=== Firebase Test Complete ===');
console.log('Your Firebase configuration is working correctly! 🎉');
console.log('');

process.exit(0);
