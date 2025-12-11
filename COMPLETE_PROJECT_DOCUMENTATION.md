# Complete Online Auction Platform - Master Documentation

**Project**: Online Auction Platform (eBay/Yahoo Auctions-style)
**Last Updated**: December 3, 2025
**Status**: Production Ready

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Setup & Installation](#setup--installation)
4. [Network Configuration (ngrok)](#network-configuration)
5. [Features Implemented](#features-implemented)
6. [Mobile App Features](#mobile-app-features)
7. [Backend Architecture](#backend-architecture)
8. [Database Schema](#database-schema)
9. [Authentication & Security](#authentication--security)
10. [Real-time Features](#real-time-features)
11. [Troubleshooting](#troubleshooting)
12. [Future Enhancements](#future-enhancements)

---

## 1. Project Overview

A full-stack auction platform with web and mobile applications, supporting:
- Real-time bidding with Socket.io
- Multi-language support (English/Mongolian)
- Automotive category specialization
- AI-powered category suggestions
- Rich media support (20 images per product)
- Scheduled auction starts (Yahoo Auctions-style)
- Google OAuth authentication
- Phone number authentication

### Platform Components:
- **Web Frontend**: React + Vite
- **Mobile App**: React Native (Expo)
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **Real-time**: Socket.io
- **File Storage**: Local/Cloud
- **Payments**: QPay integration

---

## 2. Technology Stack

### Frontend (Web)
```json
{
  "framework": "React 18.2.0",
  "build-tool": "Vite 4.4.5",
  "ui": "Bootstrap 5.3.0",
  "routing": "React Router DOM 6.14.2",
  "state": "Context API",
  "real-time": "socket.io-client 4.7.2",
  "editor": "TinyMCE (rich text)",
  "forms": "React Hook Form",
  "http": "Axios"
}
```

### Mobile (App)
```json
{
  "framework": "React Native (Expo)",
  "navigation": "Expo Router",
  "ui": "React Native built-in + Ionicons",
  "storage": "AsyncStorage",
  "images": "expo-image-picker",
  "auth": "expo-auth-session",
  "real-time": "socket.io-client"
}
```

### Backend
```json
{
  "runtime": "Node.js",
  "framework": "Express.js",
  "database": "MongoDB (Mongoose)",
  "real-time": "socket.io",
  "auth": "JWT + bcrypt",
  "validation": "express-validator",
  "file-upload": "multer",
  "email": "nodemailer",
  "payment": "QPay API",
  "security": "helmet, cors, rate-limiter"
}
```

---

## 3. Setup & Installation

### Prerequisites
- Node.js 16+ and npm
- MongoDB 5+
- Git

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm start  # Runs on port 5000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev  # Runs on port 5173
```

### Mobile Setup
```bash
cd mobile/auctionapp
npm install
npx expo start  # Scan QR code with Expo Go app
```

### Environment Variables

**Backend (.env)**:
```bash
MONGODB_URI=mongodb://localhost:27017/auction
JWT_SECRET=your-secret-key-here
PORT=5000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Firebase (Phone Auth)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# QPay
QPAY_USERNAME=your-qpay-username
QPAY_PASSWORD=your-qpay-password
QPAY_INVOICE_CODE=your-invoice-code

# Email
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# OpenAI (Optional - for better AI category suggestions)
OPENAI_API_KEY=your-openai-key
```

**Mobile (.env)**:
```bash
EXPO_PUBLIC_API_BASE_URL=https://your-ngrok-url.ngrok-free.dev
EXPO_PUBLIC_SOCKET_URL=https://your-ngrok-url.ngrok-free.dev

EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-client-id
EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=your-expo-client-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id
```

---

## 4. Network Configuration (ngrok)

### Problem Solved
- Mobile app needs to connect to backend from any network
- IP addresses change when switching networks (home/office/etc.)

### Solution: ngrok Tunnel

**Setup**:
1. Download ngrok: https://ngrok.com
2. Extract to folder (e.g., `C:\ngrok\`)
3. Start tunnel: `ngrok http 5000`
4. Copy HTTPS URL (e.g., `https://abc123.ngrok-free.dev`)
5. Update mobile `.env` with ngrok URL

**Benefits**:
- ✅ Works from anywhere (any WiFi, mobile data)
- ✅ No IP address changes needed
- ✅ HTTPS included
- ✅ Easy sharing for testing

**Backend CORS** (already configured):
```javascript
// Automatically allows all ngrok domains
origin.includes('ngrok.io') || origin.includes('ngrok-free.dev')
```

**Current Configuration**:
- Mobile: Uses ngrok URL from `.env`
- Backend: Allows ngrok domains via wildcard
- Socket.io: Allows ngrok domains via wildcard

---

## 5. Features Implemented

### Core Auction Features
- ✅ Create auction listings
- ✅ Real-time bidding with Socket.io
- ✅ Bid history tracking
- ✅ Countdown timers
- ✅ Auto-close when time expires
- ✅ Instant "Sell Now" for sellers
- ✅ Scheduled auction starts (immediate or future date/time)
- ✅ Auction duration options (1, 3, 5, 7, 10, 14 days)

### Category System
- ✅ 66 Mongolian marketplace categories
- ✅ Parent/subcategory hierarchy
- ✅ AI-powered category suggestions (rule-based + optional OpenAI)
- ✅ Category icons (emoji support)
- ✅ Browse by category
- ✅ Trending categories

### Product Management
- ✅ Rich text editor (TinyMCE) for descriptions
- ✅ Multiple image upload (up to 20 images)
- ✅ Image preview and management
- ✅ Auto-title generation for vehicles
- ✅ Product search
- ✅ Filters (category, price, condition, etc.)
- ✅ Watchlist/favorites
- ✅ Like products

### Automotive Features
- ✅ Specialized fields for vehicles:
  - Manufacturer, Model, Year
  - Mileage, Engine Size
  - Fuel Type, Transmission
  - Color, Condition
- ✅ Auto-generated titles (e.g., "2020 Toyota Camry")
- ✅ Vehicle-specific filters
- ✅ VIN/chassis number support

### User Management
- ✅ User registration/login
- ✅ Google OAuth (web + mobile)
- ✅ Phone number authentication (Firebase)
- ✅ Email verification
- ✅ Password reset
- ✅ User profiles
- ✅ Balance/wallet system
- ✅ Transaction history

### Payment Integration
- ✅ QPay integration (Mongolia)
- ✅ QR code generation
- ✅ Payment verification
- ✅ Balance top-up
- ✅ Automated balance updates

### Admin Features
- ✅ User management
- ✅ Product moderation
- ✅ Category management
- ✅ Payment approval
- ✅ Transaction monitoring
- ✅ Analytics dashboard

### Internationalization
- ✅ Mongolian language support
- ✅ English language support
- ✅ Language switcher
- ✅ Translated UI components
- ✅ Mongolian category names

### Security
- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ Input validation
- ✅ SQL/NoSQL injection prevention
- ✅ XSS protection
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ Helmet security headers

---

## 6. Mobile App Features

### Implemented Features (100% Web Parity)

#### Product Creation
- ✅ Full product creation form
- ✅ AI category suggester (mobile-optimized UI)
- ✅ Multiple image picker (up to 20)
- ✅ Rich text description (plain text for mobile)
- ✅ Auction start modes:
  - Immediate start
  - Scheduled start (date + time picker)
- ✅ Duration selection (1-14 days)
- ✅ Automotive fields (conditional)
- ✅ Form validation
- ✅ Image preview & removal

#### Navigation
- ✅ Bottom tab navigation (Home, Search, Selling, Profile)
- ✅ Floating Action Button (FAB) for quick add
- ✅ Category browsing
- ✅ Product details
- ✅ Bid history modal

#### Authentication
- ✅ Login screen
- ✅ Registration screen
- ✅ Google Sign-In
- ✅ Phone number authentication
- ✅ EULA acceptance
- ✅ Profile management

#### Bidding
- ✅ Place bids
- ✅ Real-time bid updates (Socket.io)
- ✅ Bid history
- ✅ My bids screen
- ✅ My wins screen
- ✅ My losses screen
- ✅ Outbid notifications

#### Other Features
- ✅ Watchlist
- ✅ Liked products
- ✅ Balance management
- ✅ Notification settings
- ✅ Search functionality
- ✅ Category filtering
- ✅ Pull-to-refresh
- ✅ Skeleton loaders
- ✅ Error handling
- ✅ Network monitoring

### Mobile-Specific Optimizations
- ✅ FlatList virtualization (performance)
- ✅ Image caching
- ✅ Debounced search
- ✅ Network state detection
- ✅ Offline error handling
- ✅ Touch-friendly UI (44px minimum tap targets)
- ✅ Native feel (iOS/Android)

---

## 7. Backend Architecture

### API Structure
```
backend/
├── controllers/       # Business logic
│   ├── userController.js
│   ├── productController.js
│   ├── biddingController.js
│   ├── categoryController.js
│   ├── paymentController.js
│   └── ...
├── models/           # MongoDB schemas
│   ├── User.js
│   ├── Product.js
│   ├── Bidding.js
│   ├── Category.js
│   └── ...
├── routes/           # API endpoints
│   ├── userRoute.js
│   ├── productRoute.js
│   ├── biddingRoute.js
│   └── ...
├── middleware/       # Auth, validation, etc.
│   ├── auth.js
│   ├── rateLimiter.js
│   └── ...
├── utils/            # Helpers
│   ├── socket.js
│   ├── aiCategoryClassifier.js
│   └── ...
├── services/         # External services
│   ├── emailService.js
│   ├── qpayService.js
│   └── ...
├── app.js            # Express app + HTTP CORS
└── server.js         # Socket.io server
```

### Key API Endpoints

**Authentication**:
```
POST   /api/users/register
POST   /api/users/login
POST   /api/users/google
POST   /api/users/google-mobile
POST   /api/users/phone-auth
POST   /api/users/forgot-password
POST   /api/users/reset-password/:token
GET    /api/users/me
```

**Products**:
```
GET    /api/product/products
GET    /api/product/:id
POST   /api/product/
PUT    /api/product/:id
DELETE /api/product/:id
GET    /api/product/my
POST   /api/product/suggest-category  # AI suggestions
```

**Bidding**:
```
POST   /api/bidding/bid
GET    /api/bidding/:productId
GET    /api/bidding/my-bids
GET    /api/bidding/my-wins
POST   /api/product/:id/sell-now
```

**Categories**:
```
GET    /api/category/
POST   /api/category/
PUT    /api/category/:id
DELETE /api/category/:id
```

**Payments**:
```
POST   /api/request/              # Create payment request
GET    /api/request/:id/check     # Check payment status
POST   /api/users/addBalance      # Add balance (admin)
GET    /api/users/userbalance     # Get user balance
```

**Watchlist**:
```
POST   /api/watchlist/add
DELETE /api/watchlist/remove/:productId
GET    /api/watchlist/my
```

---

## 8. Database Schema

### User Model
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  phoneNumber: String,
  profileImage: String,
  balance: Number (default: 0),
  role: String (enum: ['user', 'admin']),
  isVerified: Boolean,
  googleId: String,
  eulaAccepted: Boolean,
  eulaAcceptedAt: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Product Model
```javascript
{
  _id: ObjectId,
  title: String (required),
  description: String (required, HTML supported),
  price: Number (starting bid),
  currentBid: Number,
  category: ObjectId (ref: 'Category'),
  images: [{
    url: String,
    public_id: String
  }],
  user: ObjectId (ref: 'User'),
  bidDeadline: Date,
  sellType: String (enum: ['auction']),

  // Auction settings
  startMode: String (enum: ['immediate', 'scheduled']),
  scheduledDate: Date,
  scheduledTime: String,
  auctionDuration: Number (days),

  // Automotive fields
  manufacturer: String,
  model: String,
  year: Number,
  mileage: Number,
  engineSize: String,
  fuelType: String,
  transmission: String,
  color: String,
  condition: String,

  // Metadata
  bids: [ObjectId] (ref: 'Bidding'),
  views: Number,
  likes: Number,
  status: String (enum: ['active', 'sold', 'expired']),
  createdAt: Date,
  updatedAt: Date
}
```

### Bidding Model
```javascript
{
  _id: ObjectId,
  product: ObjectId (ref: 'Product'),
  user: ObjectId (ref: 'User'),
  price: Number,
  timestamp: Date,
  isWinning: Boolean,
  status: String (enum: ['active', 'won', 'outbid'])
}
```

### Category Model
```javascript
{
  _id: ObjectId,
  title: String (English),
  titleMn: String (Mongolian),
  slug: String (unique),
  description: String,
  icon: String (emoji or icon name),
  image: String,
  parent: ObjectId (ref: 'Category'),
  keywords: [String],  // For AI classification
  order: Number,
  isActive: Boolean,
  createdAt: Date
}
```

### Watchlist Model
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: 'User'),
  product: ObjectId (ref: 'Product'),
  addedAt: Date
}
```

### Payment Request Model
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: 'User'),
  amount: Number,
  qpayInvoiceId: String,
  qrCode: String,
  status: String (enum: ['pending', 'paid', 'failed']),
  createdAt: Date,
  paidAt: Date
}
```

---

## 9. Authentication & Security

### JWT Authentication
```javascript
// Token generation
const token = jwt.sign(
  { id: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '30d' }
);

// Token verification (middleware)
const auth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded.id);
  next();
};
```

### Google OAuth Flow
1. User clicks "Sign in with Google"
2. Frontend opens Google OAuth consent screen
3. Google redirects with authorization code
4. Backend exchanges code for Google profile
5. Backend creates/finds user in database
6. Backend returns JWT token
7. Frontend stores token in localStorage/AsyncStorage

### Phone Authentication Flow
1. User enters phone number
2. Firebase sends SMS with code
3. User enters verification code
4. Frontend verifies code with Firebase
5. Backend creates/finds user by phone
6. Backend returns JWT token

### Security Measures
- ✅ Password hashing (bcrypt, salt rounds: 10)
- ✅ JWT tokens (30-day expiry)
- ✅ Input validation (express-validator)
- ✅ SQL/NoSQL injection prevention (mongo-sanitize)
- ✅ XSS prevention (helmet, sanitization)
- ✅ Rate limiting (express-rate-limit)
- ✅ CORS configured
- ✅ HTTPS in production (ngrok provides HTTPS in dev)

---

## 10. Real-time Features (Socket.io)

### Connection
```javascript
// Client-side
import { io } from 'socket.io-client';
const socket = io(SOCKET_URL, {
  query: { token: userToken }
});

// Server-side
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
});
```

### Real-time Bidding
```javascript
// Client places bid
socket.emit('placeBid', {
  productId,
  bidAmount,
  userId
});

// Server broadcasts to all clients
io.emit('newBid', {
  productId,
  newBid: bidData,
  highestBidder: userData
});

// Other clients receive update
socket.on('newBid', (data) => {
  updateProductBid(data);
  showNotification('Someone placed a higher bid!');
});
```

### Auction End Events
```javascript
// Server detects auction ended
io.emit('auctionEnded', {
  productId,
  winner: winnerData,
  finalBid: amount
});

// Client receives notification
socket.on('auctionEnded', (data) => {
  if (data.winner._id === currentUser._id) {
    showNotification('Congratulations! You won!');
  } else {
    showNotification('Auction ended. You were outbid.');
  }
});
```

### Connection Management
```javascript
// Mobile app
useEffect(() => {
  if (connected) {
    socket.connect();
    socket.on('connect', () => console.log('Connected'));
    socket.on('disconnect', () => console.log('Disconnected'));
  }
  return () => socket.disconnect();
}, [connected]);
```

---

## 11. Troubleshooting

### Common Issues & Solutions

#### 1. "Network Error" on Mobile
**Symptoms**: Mobile app can't connect to backend

**Checks**:
- Is backend running? (`http://localhost:5000/api/health`)
- Is ngrok running? (check terminal for URL)
- Did you update `.env` with correct ngrok URL?
- Are you on the same network? (not required with ngrok)

**Solution**:
```bash
# 1. Restart backend
cd backend
npm start

# 2. Check ngrok
ngrok http 5000
# Copy new URL if changed

# 3. Update mobile/.env
EXPO_PUBLIC_API_BASE_URL=https://new-ngrok-url.ngrok-free.dev

# 4. Restart mobile app
```

#### 2. "CORS Error" in Browser
**Symptoms**: API calls blocked by CORS policy

**Solution**:
- Check `backend/app.js` ALLOWED_ORIGINS includes your frontend URL
- Restart backend after changing CORS config
- For ngrok, wildcard is already configured

#### 3. Socket.io Not Connecting
**Symptoms**: Real-time updates not working

**Checks**:
- Check browser/app console for Socket errors
- Verify Socket URL matches API URL
- Check `backend/server.js` CORS allows origin

**Solution**:
```javascript
// Mobile: Ensure Socket URL is set
EXPO_PUBLIC_SOCKET_URL=https://your-ngrok-url.ngrok-free.dev

// Backend: server.js already allows ngrok wildcards
```

#### 4. Images Not Uploading
**Symptoms**: Error during image upload

**Checks**:
- Is `backend/uploads/` directory writable?
- Are images under 5MB each?
- Is `multer` configured correctly?

**Solution**:
```bash
# Create uploads directory
mkdir backend/uploads
chmod 755 backend/uploads
```

#### 5. Google OAuth Not Working
**Symptoms**: "Error 400: redirect_uri_mismatch"

**Solution**:
- Add redirect URI to Google Cloud Console
- Format: `http://localhost:5173` (web) or `exp://192.168.x.x:19000` (mobile)
- Update `.env` with correct client IDs

#### 6. MongoDB Connection Failed
**Symptoms**: "MongoServerError: connect ECONNREFUSED"

**Solution**:
```bash
# Check MongoDB is running
# Windows:
net start MongoDB

# Mac/Linux:
sudo systemctl start mongod

# Verify connection string in .env
MONGODB_URI=mongodb://localhost:27017/auction
```

#### 7. AI Category Suggestions Not Working
**Symptoms**: No categories suggested or error

**Solution**:
```javascript
// Uses rule-based matching by default
// No OpenAI key needed for basic functionality

// For better AI suggestions:
// 1. Get OpenAI API key
// 2. Add to backend/.env:
OPENAI_API_KEY=sk-your-key-here

// 3. Set useAI: true in request
```

---

## 12. Future Enhancements

### Planned Features
- [ ] Auction reserve prices
- [ ] Buy-it-now option alongside auction
- [ ] Bundle deals (multiple items)
- [ ] Seller ratings and reviews
- [ ] Automated auction extensions (if bid in last minute)
- [ ] Email notifications for bids
- [ ] Push notifications (mobile)
- [ ] In-app messaging between buyer/seller
- [ ] Shipping integration
- [ ] Multiple payment methods
- [ ] Product reports/moderation
- [ ] Analytics dashboard for sellers
- [ ] Saved searches
- [ ] Recommendation engine

### Technical Improvements
- [ ] Migrate to TypeScript (backend)
- [ ] Add Redis for caching
- [ ] Implement CDN for images
- [ ] Add Elasticsearch for search
- [ ] CI/CD pipeline
- [ ] Docker containerization
- [ ] Kubernetes deployment
- [ ] Load balancing
- [ ] Database sharding
- [ ] Automated testing (Jest, Cypress)
- [ ] Performance monitoring (Sentry)
- [ ] Analytics (Google Analytics, Mixpanel)

### Mobile App Enhancements
- [ ] Offline mode with sync
- [ ] Draft save for listings
- [ ] Image editing (crop, rotate, filters)
- [ ] Voice input for descriptions
- [ ] QR code scanner for products
- [ ] Native date/time pickers
- [ ] Rich text editor for mobile
- [ ] Drag-to-reorder images
- [ ] Bulk product upload
- [ ] Template-based listings

---

## Appendix A: File Structure

### Backend
```
backend/
├── controllers/
│   ├── biddingController.js
│   ├── categoryController.js
│   ├── notificationSettingsController.js
│   ├── productController.js
│   ├── reportController.js
│   ├── reviewController.js
│   ├── userController.js
│   └── watchlistController.js
├── middleware/
│   ├── auth.js
│   └── rateLimiter.js
├── models/
│   ├── Bidding.js
│   ├── Category.js
│   ├── NotificationSettings.js
│   ├── Product.js
│   ├── Report.js
│   ├── Review.js
│   ├── User.js
│   └── Watchlist.js
├── routes/
│   ├── biddingRoute.js
│   ├── categoryRoute.js
│   ├── notificationSettingsRoute.js
│   ├── productRoute.js
│   ├── reportRoute.js
│   ├── reviewRoute.js
│   ├── userRoute.js
│   └── watchlistRoute.js
├── services/
│   ├── emailService.js
│   └── qpayService.js
├── utils/
│   ├── aiCategoryClassifier.js
│   └── socket.js
├── uploads/            # Product images
├── .env.example
├── app.js              # Express + HTTP CORS
├── package.json
└── server.js           # Socket.io server
```

### Frontend
```
frontend/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── Toast.jsx
│   │   ├── bidding/
│   │   │   └── MyBidsPanel.jsx
│   │   ├── selling/
│   │   │   └── SellerDashboard.jsx
│   │   ├── CarSelector.jsx
│   │   ├── CategorySuggester.jsx
│   │   ├── FilterSidebar.jsx
│   │   ├── LikeButton.jsx
│   │   ├── MercariProductCard.jsx
│   │   ├── PriceHistoryChart.jsx
│   │   ├── ProductImage.jsx
│   │   ├── SavedFilters.jsx
│   │   └── Timer.jsx
│   ├── context/
│   │   ├── LanguageContext.jsx
│   │   ├── LikedProductsContext.jsx
│   │   └── ThemeContext.jsx
│   ├── screen/
│   │   ├── home/
│   │   │   ├── Home.jsx
│   │   │   ├── admin.jsx
│   │   │   ├── edit.jsx
│   │   │   └── profile.jsx
│   │   ├── product/
│   │   │   ├── Detail.jsx
│   │   │   └── product.jsx
│   │   └── mylist/
│   │       └── MyListSimple.jsx
│   ├── config/
│   │   └── api.js
│   └── index.css
├── package.json
└── vite.config.js
```

### Mobile
```
mobile/auctionapp/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Home screen
│   │   ├── search.tsx         # Search/Browse
│   │   ├── selling.tsx        # My Listings
│   │   └── profile.tsx        # User Profile
│   ├── (hidden)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── add-product.tsx    # Product creation
│   │   ├── my-bids.tsx
│   │   ├── my-wins.tsx
│   │   ├── my-losses.tsx
│   │   ├── watchlist.tsx
│   │   └── notification-settings.tsx
│   ├── category/
│   │   └── [id].tsx           # Category browse
│   ├── product/
│   │   └── [id].tsx           # Product detail
│   ├── components/
│   │   ├── AICategorySuggester.tsx
│   │   ├── AuctionCard.tsx
│   │   ├── BadgeIcon.tsx
│   │   ├── CategoriesMenu.tsx
│   │   ├── CategoryIcon.tsx
│   │   ├── LikeButton.tsx
│   │   ├── PaymentModal.tsx
│   │   └── ProductCard.tsx
│   ├── _layout.tsx
│   └── theme.ts
├── src/
│   ├── api.ts
│   ├── components/
│   │   ├── ErrorBoundary.tsx
│   │   └── SkeletonLoader.tsx
│   ├── config/
│   │   └── env.ts              # API URLs (ngrok)
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useDebounce.ts
│   │   ├── useImageCache.ts
│   │   ├── useNetwork.ts
│   │   ├── useProducts.ts
│   │   └── useSocket.ts
│   ├── services/
│   │   └── socket.ts
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       ├── cache.ts
│       ├── errorHandler.ts
│       └── network.ts
├── .env
├── package.json
└── app.json
```

---

## Appendix B: Quick Reference Commands

### Development
```bash
# Start all services
cd backend && npm start           # Port 5000
cd frontend && npm run dev        # Port 5173
cd mobile/auctionapp && npm start # Port 19000 (Expo)
ngrok http 5000                   # Get public URL

# Database
mongod                            # Start MongoDB
mongo                             # Open MongoDB shell

# Testing
npm test                          # Run tests
npm run lint                      # Check code quality

# Build
cd frontend && npm run build      # Build for production
cd mobile/auctionapp && eas build # Build mobile app
```

### Git
```bash
git status
git add .
git commit -m "your message"
git push origin main

# Create branch
git checkout -b feature/new-feature

# Merge
git checkout main
git merge feature/new-feature
```

### Database Seeders
```bash
cd backend
node seedMongolianCategories.js     # Add 66 categories
node seedVehicleProducts.js         # Add 10 vehicle products
node seedEULA.js                    # Add EULA document
```

---

## Appendix C: Deployment Checklist

### Pre-deployment
- [ ] Update all environment variables
- [ ] Change JWT_SECRET to production secret
- [ ] Configure production MongoDB (Atlas/etc.)
- [ ] Set up production email service
- [ ] Configure production payment gateway
- [ ] Update Google OAuth redirect URIs
- [ ] Test all features in staging
- [ ] Run security audit
- [ ] Optimize images
- [ ] Enable HTTPS
- [ ] Configure CDN

### Backend Deployment
- [ ] Choose hosting (Railway, Render, AWS, etc.)
- [ ] Set up MongoDB Atlas or similar
- [ ] Configure environment variables
- [ ] Set up file storage (S3, Cloudinary, etc.)
- [ ] Configure domain and SSL
- [ ] Set up monitoring (Sentry, etc.)
- [ ] Configure backups

### Frontend Deployment
- [ ] Build production bundle (`npm run build`)
- [ ] Deploy to Vercel/Netlify/etc.
- [ ] Configure domain
- [ ] Update API URLs
- [ ] Test all pages
- [ ] Set up analytics

### Mobile Deployment
- [ ] Update app.json with version
- [ ] Build for iOS: `eas build --platform ios`
- [ ] Build for Android: `eas build --platform android`
- [ ] Test builds
- [ ] Submit to App Store
- [ ] Submit to Play Store
- [ ] Update mobile API URLs to production

### Post-deployment
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Test all critical paths
- [ ] Verify payment processing
- [ ] Check email delivery
- [ ] Monitor database performance
- [ ] Set up alerts for downtime

---

## Conclusion

This documentation covers the complete Online Auction Platform implementation. For specific feature details, refer to the individual documentation files in the project root.

**Key Achievements**:
- ✅ Full-stack auction platform
- ✅ Web + Mobile applications
- ✅ Real-time bidding
- ✅ AI-powered features
- ✅ Multi-language support
- ✅ Payment integration
- ✅ Production-ready code

**Contact & Support**:
- GitHub Issues for bug reports
- Pull requests welcome
- Documentation updates appreciated

**Last Updated**: December 3, 2025
**Version**: 1.0.0
**Status**: Production Ready 🚀
