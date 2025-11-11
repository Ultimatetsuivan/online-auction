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

const errorHandler = require("./middleware/errorMiddleWare");
const { apiLimiter } = require("./middleware/rateLimiter");

// Initialize Firebase Admin SDK
const { initializeFirebase } = require("./config/firebase");
initializeFirebase();

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API
  crossOriginEmbedderPolicy: false
}));
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(cookieParser());

// Improved CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

  const ALLOWED_ORIGINS = [
    'http://localhost:5173',   // Vite dev
    'http://127.0.0.1:5173',
    'http://localhost:5174',   // Vite dev (alternative port)
    'http://127.0.0.1:5174',
    'http://localhost:4173',   // Vite preview
    'http://127.0.0.1:4173',
    'http://localhost:3000',   // (optional) CRA
    'http://127.0.0.1:3000',
    'http://192.168.1.10:5173', // Your computer's IP for mobile access (new network)
    'http://172.29.33.228:5173',
    'http://192.168.56.1:5173',
    'http://192.168.144.1:5173',
    'http://192.168.140.1:5173',
    'http://172.22.96.1:5173',
    // add your deployed web origin(s) here when you have them, e.g.:
    // 'https://auction.your-domain.mn'
  ];

const corsOptions = {
  origin: (origin, cb) => {
    // allow tools like curl/postman (no Origin header) and your whitelisted origins
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
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
app.use("/api/deposits", depositRoute);
app.use("/api/legal", legalRoute);
app.use("/api/admin", adminAnalyticsRoute);
app.use("/api/webhook", paymentWebhookRoute);

app.use("/uploads", express.static(path.join(__dirname, "upload")));

app.use(errorHandler);

module.exports = app; 
