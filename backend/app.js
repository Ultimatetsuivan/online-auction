// app.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");

// Existing routes
const productRoute = require("./routes/productRoute");
const biddingRoute = require("./routes/biddingRoute");
const userRoute = require("./routes/userRoute");
const categoryRoute = require("./routes/categoryRoute");
const searchRoute = require("./routes/searchRoute");
const requestRoute = require("./routes/requestRoute");
const transactionRoute = require("./routes/transactionRoute");
const myListRoute = require("./routes/myListRoute");

// New routes
const phoneAuthRoute = require("./routes/phoneAuthRoute");
const likeRoute = require("./routes/likeRoute");
const notificationRoute = require("./routes/notificationRoute");
const depositRoute = require("./routes/depositRoute");
const legalRoute = require("./routes/legalRoute");
const adminAnalyticsRoute = require("./routes/adminAnalyticsRoute");
const paymentWebhookRoute = require("./routes/paymentWebhookRoute");
const reviewRoute = require("./routes/reviewRoute");
const reportRoute = require("./routes/reportRoute");
const watchlistRoute = require("./routes/watchlistRoute");
const notificationSettingsRoute = require("./routes/notificationSettingsRoute");
// COMMENTED OUT: Luxury item verification (replaced with identity verification)
// const verificationRoute = require("./routes/verificationRoute");
const identityVerificationRoute = require("./routes/identityVerificationRoute");

const errorHandler = require("./middleware/errorMiddleWare");
const { apiLimiter } = require("./middleware/rateLimiter");

// Initialize Firebase Admin SDK
const { initializeFirebase } = require("./config/firebase");
initializeFirebase();

const app = express();

// Trust proxy - Required when behind a reverse proxy (ngrok, load balancer, etc.)
// This allows express-rate-limit to correctly identify client IPs from X-Forwarded-For header
// Set to 1 to trust the first proxy (more secure than 'true')
// For development: trust ngrok and local proxies
// For production: configure based on your infrastructure
app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : 'loopback, linklocal, uniquelocal');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API
  crossOriginEmbedderPolicy: false
}));
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(cookieParser());

// CORS configuration
const ALLOWED_ORIGINS = [
    'http://localhost:5173',   // Vite dev
    'http://127.0.0.1:5173',
    'http://localhost:5174',   // Vite dev (alternative port)
    'http://127.0.0.1:5174',
    'http://localhost:4173',   // Vite preview
    'http://127.0.0.1:4173',
    'http://localhost:3000',   // React dev
    'http://127.0.0.1:3000',
    // ngrok tunnels handled by wildcard in corsOptions
    // Production domains can be added here when deployed
  ];

const corsOptions = {
  origin: (origin, cb) => {
    // allow tools like curl/postman (no Origin header) and your whitelisted origins
    // Also allow any ngrok domains for development
    if (!origin ||
        ALLOWED_ORIGINS.includes(origin) ||
        (origin && (origin.includes('ngrok.io') || origin.includes('ngrok-free.dev')))) {
      return cb(null, true);
    }
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-access-token'],
  exposedHeaders: ['x-access-token'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to all API routes
app.use("/api/", apiLimiter);

// Health check endpoint (no rate limiting)
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Existing routes
app.use("/api/users", userRoute);
app.use("/api/product", productRoute);
app.use("/api/bidding", biddingRoute);
app.use("/api/category", categoryRoute);
app.use("/api/search", searchRoute);
app.use("/api/transaction", transactionRoute);
app.use("/api/request", requestRoute);
app.use("/api/mylist", myListRoute);

// New feature routes
app.use("/api/auth", phoneAuthRoute);
app.use("/api/likes", likeRoute);
app.use("/api/notifications", notificationRoute);
app.use("/api/notification-settings", notificationSettingsRoute);
app.use("/api/watchlist", watchlistRoute);
app.use("/api/deposits", depositRoute);
app.use("/api/legal", legalRoute);
app.use("/api/admin", adminAnalyticsRoute);
app.use("/api/webhook", paymentWebhookRoute);
app.use("/api/reviews", reviewRoute);
app.use("/api", reportRoute);
// COMMENTED OUT: Luxury item verification route
// app.use("/api/verification", verificationRoute);
app.use("/api/identity-verification", identityVerificationRoute);

app.use("/uploads", express.static(path.join(__dirname, "upload")));

app.use(errorHandler);

module.exports = app; 
