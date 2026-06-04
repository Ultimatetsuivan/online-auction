const dotenv = require('dotenv').config();
const mongoose = require('mongoose');
const http = require('http');
const socketio = require('socket.io');
const app = require('./app');
const jwt = require('jsonwebtoken');
const Product = require('./models/product');

// Disable Mongoose buffering to prevent timeout errors when connection is not ready
mongoose.set('bufferCommands', false);

// Import auction scheduler
const { startAuctionScheduler } = require('./services/auctionScheduler');

// Import socket utility
const { setIO } = require('./utils/socket');

const server = http.createServer(app);
const activeAuctions = {};

// Improved CORS configuration with environment variables
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

const io = socketio(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow ngrok domains for development
      if (!origin ||
          allowedOrigins.includes(origin) ||
          (origin && (origin.includes('ngrok.io') || origin.includes('ngrok-free.dev')))) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Make io instance available to other modules
setIO(io);

io.on('connection', (socket) => {
  const token = socket.handshake.query.token;

  // Allow anonymous connections for viewing (but authenticated for bidding)
  if (token) {
    if (!process.env.JWT_SECRET) {
      socket.userId = null;
    } else {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
      } catch (err) {
        socket.userId = null;
      }
    }
  } else {
    socket.userId = null;
  }

  socket.on('productSold', async ({ productId }) => {
    try {
      const product = await Product.findById(productId);
      if (product) {
        io.emit('productUpdate', product);
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to update product' });
    }
  });

  socket.on('bidUpdate', (product) => {
    io.emit('bidUpdate', product);
  });

  socket.on('startAuctionCountdown', ({ productId, deadline }) => {
    if (activeAuctions[productId]) {
      clearInterval(activeAuctions[productId]);
      delete activeAuctions[productId];
    }

    const broadcastTime = () => {
      const now = new Date();
      const end = new Date(deadline);
      const remaining = end - now;

      if (remaining <= 0) {
        io.emit('auctionEnded', { productId });
        clearInterval(activeAuctions[productId]);
        delete activeAuctions[productId];
      } else {
        io.emit('countdownUpdate', {
          productId,
          timeLeft: {
            days: Math.floor(remaining / (1000 * 60 * 60 * 24)),
            hours: Math.floor((remaining / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((remaining / 1000 / 60) % 60),
            seconds: Math.floor((remaining / 1000) % 60)
          }
        });
      }
    };

    broadcastTime();
    
    activeAuctions[productId] = setInterval(broadcastTime, 1000);
  });


});

// MongoDB connection options
const mongooseOptions = {
  serverSelectionTimeoutMS: 10000, // Timeout after 10s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  connectTimeoutMS: 10000, // Connection timeout
  retryWrites: true,
  w: 'majority',
};

// Track if scheduler has been started
let schedulerStarted = false;
// Track if server has been started
let serverStarted = false;

// Function to start scheduler only once after successful connection
const startSchedulerIfReady = () => {
  if (!schedulerStarted && mongoose.connection.readyState === 1) {
    setTimeout(() => {
      startAuctionScheduler();
      schedulerStarted = true;
    }, 1000);
  }
};

// Function to validate MongoDB connection string
const validateMongoURI = (uri) => {
  if (!uri) return { valid: false, error: 'MONGO_URI is not set' };
  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    return { valid: false, error: 'Invalid MongoDB connection string format' };
  }
  if (uri.includes('<db_password>') || uri.includes('<password>')) {
    return { valid: false, error: 'Please replace <db_password> with your actual MongoDB password' };
  }
  if (uri.includes('<database_name>')) {
    return { valid: false, error: 'Please replace <database_name> with your actual database name' };
  }
  return { valid: true };
};

// Function to connect to MongoDB with retry logic
const connectToMongoDB = async (retryCount = 0, maxRetries = 5) => {
  // Validate connection string first
  const validation = validateMongoURI(process.env.MONGO_URI);
  if (!validation.valid) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, mongooseOptions);
    startSchedulerIfReady();
  } catch (err) {
    const errorMessage = err.message || String(err);
    const isIPWhitelistError = errorMessage && (
      errorMessage.includes('IP') || 
      errorMessage.includes('whitelist') ||
      errorMessage.includes('Atlas') ||
      errorMessage.includes('ENOTFOUND')
    );

    const isAuthError = errorMessage && (
      errorMessage.includes('authentication') ||
      errorMessage.includes('password') ||
      errorMessage.includes('credentials')
    );

    if (isIPWhitelistError) {
    } else if (isAuthError) {
    } else {
    }

    if (retryCount < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Exponential backoff, max 30s
      setTimeout(() => connectToMongoDB(retryCount + 1, maxRetries), delay);
    } else {
    }
  }
};

// Start server function (only once)
const startServer = () => {
  if (serverStarted) {
    return; // Server already started
  }
  serverStarted = true;
  server.listen(process.env.PORT || 5000, () => {
    if (mongoose.connection.readyState !== 1) {
    }
  });
};

// Handle connection events
mongoose.connection.on('error', (err) => {
});

mongoose.connection.on('disconnected', () => {
  schedulerStarted = false; // Reset scheduler flag
  // Attempt to reconnect
  if (process.env.MONGO_URI) {
    connectToMongoDB();
  }
});

mongoose.connection.on('reconnected', () => {
  startSchedulerIfReady();
});

mongoose.connection.on('connected', () => {
  startSchedulerIfReady();
});

// Validate required environment variables
const requiredEnvVars = ['MONGO_URI'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  missingEnvVars.forEach(varName => {
  });
  process.exit(1);
}

// Warn about missing optional but recommended variables
if (!process.env.JWT_SECRET) {
}

// Start MongoDB connection
connectToMongoDB();
// Start server immediately (will work even if DB connection fails)
startServer();
