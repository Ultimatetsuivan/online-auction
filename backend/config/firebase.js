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
        return admin;
    } catch (error) {
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
