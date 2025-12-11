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
      console.warn('⚠ JWT_SECRET not set, cannot verify tokens');
      socket.userId = null;
    } else {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        console.log(`✓ User ${socket.userId} connected via socket ${socket.id}`);
      } catch (err) {
        console.warn('⚠ Invalid token, allowing anonymous connection');
        socket.userId = null;
      }
    }
  } else {
    console.log(`✓ Anonymous user connected via socket ${socket.id}`);
    socket.userId = null;
  }

  socket.on('productSold', async ({ productId }) => {
    try {
      const product = await Product.findById(productId);
      if (product) {
        io.emit('productUpdate', product);
      }
    } catch (error) {
      console.error('Error handling productSold:', error.message);
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
      console.log('✓ Auction scheduler started');
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
    console.error(`\n❌ ${validation.error}`);
    console.error('   Please check your .env file and update MONGO_URI\n');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, mongooseOptions);
    console.log('✓ Database connected successfully');
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
      console.error('\n❌ MongoDB Atlas Connection Error:');
      console.error('   Your IP address is not whitelisted in MongoDB Atlas.');
      console.error('   Please add your current IP to the Atlas IP whitelist:');
      console.error('   https://www.mongodb.com/docs/atlas/security-whitelist/\n');
      console.error('   Or use 0.0.0.0/0 to allow all IPs (less secure, for development only)\n');
    } else if (isAuthError) {
      console.error('\n❌ MongoDB Authentication Error:');
      console.error('   Invalid username or password in connection string.');
      console.error('   Please check your MONGO_URI credentials.\n');
    } else {
      console.error('❌ Database connection error:', errorMessage);
    }

    if (retryCount < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Exponential backoff, max 30s
      console.log(`   Retrying connection in ${delay / 1000} seconds... (Attempt ${retryCount + 1}/${maxRetries})`);
      setTimeout(() => connectToMongoDB(retryCount + 1, maxRetries), delay);
    } else {
      console.error('\n⚠️  Failed to connect to MongoDB after multiple attempts.');
      console.error('   The server will continue running but database operations will fail.');
      console.error('   Please check your MONGO_URI and MongoDB connection.\n');
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
    console.log(`✓ Server running on port ${process.env.PORT || 5000}`);
    if (mongoose.connection.readyState !== 1) {
      console.warn('⚠️  Server started without database connection. Some features may not work.');
    }
  });
};

// Handle connection events
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
  schedulerStarted = false; // Reset scheduler flag
  // Attempt to reconnect
  if (process.env.MONGO_URI) {
    console.log('   Attempting to reconnect...');
    connectToMongoDB();
  }
});

mongoose.connection.on('reconnected', () => {
  console.log('✓ MongoDB reconnected');
  startSchedulerIfReady();
});

mongoose.connection.on('connected', () => {
  console.log('✓ MongoDB connection established');
  startSchedulerIfReady();
});

// Validate required environment variables
const requiredEnvVars = ['MONGO_URI'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('\n❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\n   Please create a .env file in the backend directory with:');
  console.error('   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name\n');
  process.exit(1);
}

// Warn about missing optional but recommended variables
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET is not set. Authentication features may not work properly.');
  console.warn('   Please set JWT_SECRET in your .env file.\n');
}

// Start MongoDB connection
connectToMongoDB();
// Start server immediately (will work even if DB connection fails)
startServer();
