const rateLimit = require('express-rate-limit');

// Simple in-memory rate limiting (upgrade to Redis for production)
// To use Redis: npm install rate-limit-redis redis
// Then uncomment the Redis setup below

/*
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const redisClient = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
});
*/

// Login rate limiter - prevent brute force attacks
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: {
        error: '15 минутын дараа дахин оролдоно уу',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // store: new RedisStore({ client: redisClient }), // Uncomment for Redis
    skipSuccessfulRequests: true // Don't count successful logins
});

// OTP rate limiter - prevent SMS spam
const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 3, // 3 OTP requests per window
    message: {
        error: 'Хэт олон удаа код илгээлээ. 10 минутын дараа дахин оролдоно уу',
        retryAfter: '10 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // store: new RedisStore({ client: redisClient }), // Uncomment for Redis
});

// General API rate limiter - Increased for better UX with multiple products
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 500, // 500 requests per minute (increased from 100 to handle multiple product cards with likes)
    message: {
        error: 'Хэт олон хүсэлт илгээлээ. Түр хүлээнэ үү',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // store: new RedisStore({ client: redisClient }), // Uncomment for Redis
});

// Bidding rate limiter - prevent spam bidding
const biddingLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // Max 10 bids per minute
    message: {
        error: 'Хэт олон үнийн санал өгч байна. Түр хүлээнэ үү',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // store: new RedisStore({ client: redisClient }), // Uncomment for Redis
    skipSuccessfulRequests: true // Don't count failed bids
});

// Payment request rate limiter
const paymentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Max 5 payment requests per hour
    message: {
        error: 'Хэт олон төлбөрийн хүсэлт илгээлээ. 1 цагийн дараа дахин оролдоно уу',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // store: new RedisStore({ client: redisClient }), // Uncomment for Redis
});

module.exports = {
    loginLimiter,
    otpLimiter,
    apiLimiter,
    biddingLimiter,
    paymentLimiter
};
