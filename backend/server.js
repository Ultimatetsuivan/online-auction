const dotenv = require('dotenv').config();
const mongoose = require('mongoose');
const http = require('http');
const socketio = require('socket.io');
const app = require('./app'); 
const jwt = require('jsonwebtoken');
const Product = require('./models/product');

const server = http.createServer(app);
const activeAuctions = {};

// Improved CORS configuration with environment variables
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

const io = socketio(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

io.on('connection', (socket) => {
  const token = socket.handshake.query.token;

  // Allow anonymous connections for viewing (but authenticated for bidding)
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      console.log(`✓ User ${socket.userId} connected via socket ${socket.id}`);
    } catch (err) {
      console.warn('⚠ Invalid token, allowing anonymous connection');
      socket.userId = null;
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

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    server.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error('Database connection error:', err);
    process.exit(1);
  });
