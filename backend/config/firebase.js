const admin = require('firebase-admin');

let firebaseInitialized = false;

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
    if (firebaseInitialized) {
        return admin;
    }

    try {
        // Check if credentials are provided
        if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
            console.warn('Firebase credentials not found in environment variables. Push notifications will not work.');
            console.warn('Please add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to .env file');
            return null;
        }

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
            })
        });

        firebaseInitialized = true;
        console.log('Firebase Admin SDK initialized successfully');
        return admin;
    } catch (error) {
        console.error('Failed to initialize Firebase Admin SDK:', error.message);
        return null;
    }
};

// Get messaging instance
const getMessaging = () => {
    const app = initializeFirebase();
    return app ? app.messaging() : null;
};

module.exports = {
    initializeFirebase,
    getMessaging,
    admin
};
