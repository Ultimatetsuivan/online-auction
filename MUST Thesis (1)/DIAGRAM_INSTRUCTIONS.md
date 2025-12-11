# Diagram Creation/Update Instructions

This document lists all diagrams needed for the thesis. Create these diagrams using tools like draw.io, Lucidchart, or PlantUML.

## DIAGRAMS TO CREATE/UPDATE

---

## 1. SYSTEM ARCHITECTURE DIAGRAMS

### 1.1 Overall System Architecture
**File:** `Diagrams/system-architecture.png`

**Instructions:**
Create a diagram showing three main components:
```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENTS                                  │
├─────────────────┬─────────────────┬─────────────────────────┤
│  Web Browser    │  iOS Device     │  Android Device         │
│  (React.js)     │  (React Native) │  (React Native)         │
└────────┬────────┴────────┬────────┴─────────┬───────────────┘
         │                 │                  │
         └─────────────────┼──────────────────┘
                           │
              ┌────────────▼──────────────┐
              │    API Gateway            │
              │    (Express.js)           │
              └────────────┬──────────────┘
                           │
         ┌─────────────────┼──────────────────┐
         │                 │                  │
    ┌────▼─────┐    ┌──────▼────┐    ┌──────▼─────┐
    │ REST API │    │ WebSocket │    │   Auth     │
    │ Endpoints│    │ (Socket.io│    │  (JWT)     │
    └────┬─────┘    └─────┬─────┘    └──────┬─────┘
         │                │                  │
         └────────────────┼──────────────────┘
                          │
              ┌───────────▼───────────┐
              │   Backend Services    │
              ├───────────────────────┤
              │ - Product Service     │
              │ - Bidding Service     │
              │ - User Service        │
              │ - Category Service    │
              │ - Notification Service│
              └───────────┬───────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
    ┌────▼─────┐    ┌─────▼────┐    ┌────▼────┐
    │ MongoDB  │    │Cloudinary│    │Firebase │
    │          │    │ (Images) │    │  (Auth) │
    └──────────┘    └──────────┘    └─────────┘
```

**Components to show:**
- Frontend layer: Web, iOS, Android
- API Gateway
- Backend services
- Database and external services
- Communication protocols (HTTP, WebSocket)

---

### 1.2 Mobile App Architecture
**File:** `Diagrams/mobile-architecture.png`

**Instructions:**
Create a layered architecture diagram for the mobile app:

**Layers:**
1. **Presentation Layer**
   - Screens (Home, Search, Selling, Profile)
   - Components (ProductCard, AuctionCard, CategoryIcon)
   - Navigation (Tab, Stack)

2. **State Management Layer**
   - Context Providers (Auth, Language)
   - Local Storage (AsyncStorage)

3. **Business Logic Layer**
   - API Client
   - WebSocket Client
   - Utils & Helpers

4. **External Services Layer**
   - Backend API
   - Firebase Auth
   - Google OAuth
   - Push Notifications

---

### 1.3 Real-time Bidding Flow Diagram
**File:** `Diagrams/realtime-bidding-flow.png`

**Instructions:**
Create a sequence diagram showing real-time bidding:

```
User A          Mobile App      WebSocket       Server          Database
  │                 │               │              │                │
  │─Place Bid──────>│               │              │                │
  │                 │──Emit 'bid'──>│              │                │
  │                 │               │──Save Bid───>│──Store────────>│
  │                 │               │<─Bid Saved───│<──Confirm──────│
  │                 │<─Emit 'bid_update'───────────│                │
  │<─Update UI──────│               │              │                │
  │                 │               │              │                │
User B              │               │              │                │
  │<─────────Receive 'bid_update'───│              │                │
  │<─Update UI──────│               │              │                │
```

---

## 2. DATA MODEL DIAGRAMS

### 2.1 Enhanced ERD (Entity Relationship Diagram)
**File:** `Diagrams/erd-updated.png`

**Instructions:**
Update the existing ERD to include all current entities:

**Entities to include:**
1. **User**
   - _id, name, email, password, phone, role, balance, photo, verified
   - Relations: 1-to-many with Product, Bid, Watchlist, Review

2. **Product**
   - _id, title, description, category, images[], startingPrice, currentPrice,
   - startDate, endDate, seller, status, views, bidCount
   - Relations: many-to-1 with Category, many-to-many with User (via Bid)

3. **Category**
   - _id, name, nameEn, nameMn, parent, icon, subcategories[]
   - Relations: 1-to-many with Product

4. **Bid**
   - _id, product, user, amount, timestamp, status
   - Relations: many-to-1 with Product and User

5. **Watchlist**
   - _id, user, product, addedAt
   - Relations: many-to-1 with User and Product

6. **Review**
   - _id, reviewer, reviewee, product, rating, comment, timestamp
   - Relations: many-to-1 with User and Product

7. **Notification**
   - _id, user, type, message, read, timestamp
   - Relations: many-to-1 with User

8. **Transaction**
   - _id, buyer, seller, product, amount, status, timestamp
   - Relations: many-to-1 with User and Product

9. **NotificationSettings**
   - _id, user, emailNotifications, pushNotifications, smsNotifications
   - Relations: 1-to-1 with User

---

### 2.2 Database Schema Diagram
**File:** `Diagrams/database-schema.png`

**Instructions:**
Create a detailed MongoDB schema diagram showing:
- Collection names
- Field names and types
- Indexes
- References between collections

**Use notation:**
```
┌─────────────────────────────┐
│      users                  │
├─────────────────────────────┤
│ _id: ObjectId (PK)          │
│ name: String                │
│ email: String (unique)      │
│ password: String (hashed)   │
│ phone: String               │
│ role: String (enum)         │
│ balance: Number             │
│ photo: String               │
│ verified: Boolean           │
│ createdAt: Date             │
│ updatedAt: Date             │
└─────────────────────────────┘
```

---

## 3. WORKFLOW DIAGRAMS

### 3.1 User Registration Flow (Mobile)
**File:** `Diagrams/mobile-registration-flow.png`

**Instructions:**
Create a flowchart showing mobile user registration:

**Steps:**
1. User opens app
2. Select registration method (Email/Google/Phone)
3. If Email: Enter details → Verify email → Complete
4. If Google: OAuth flow → Auto-register → Complete
5. If Phone: Enter phone → Receive SMS → Enter code → Complete
6. Store JWT token → Navigate to Home

---

### 3.2 Product Creation Flow (Mobile)
**File:** `Diagrams/mobile-product-creation-flow.png`

**Instructions:**
Create a flowchart showing how users create products on mobile:

**Steps:**
1. User taps "Add Product"
2. Select images (max 20) from camera/gallery
3. Enter product details (title, description)
4. AI suggests categories
5. User selects category
6. Enter pricing (starting price, reserve price)
7. Set auction dates (start, end)
8. If automotive: Enter VIN, model, year, etc.
9. Preview product
10. Submit → Upload to Cloudinary → Save to DB → Success

---

### 3.3 Bidding Process Flow
**File:** `Diagrams/bidding-process-flow.png`

**Instructions:**
Create a flowchart showing the bidding process:

**Steps:**
1. User views product
2. Enter bid amount
3. Validate: amount > current price?
4. Validate: user has sufficient balance?
5. Validate: auction still active?
6. Place bid → Save to DB
7. Update product current price
8. Send WebSocket event to all viewers
9. Notify previous highest bidder (outbid)
10. Update bid history

---

### 3.4 Auction End Flow
**File:** `Diagrams/auction-end-flow.png`

**Instructions:**
Create a flowchart showing what happens when auction ends:

**Steps:**
1. Cron job checks for expired auctions
2. Find auctions where endDate < now
3. For each auction:
   - Get highest bidder
   - Mark product as "sold"
   - Deduct winner's balance
   - Add to seller's balance
   - Create transaction record
   - Notify winner
   - Notify seller
   - Notify losing bidders

---

## 4. USE CASE DIAGRAMS (Updated)

### 4.1 Mobile User Use Case
**File:** `Diagrams/mobile-user-usecase.png`

**Instructions:**
Update or create use case diagram for mobile users:

**Actors:** Mobile User, System

**Use Cases:**
- Register/Login (Google, Phone, Email)
- Browse Products
- Search Products
- Filter by Category
- View Product Details
- Add to Watchlist
- Place Bid
- Receive Notifications
- Add Product (with images)
- Manage Profile
- Top-up Balance
- View Bid History
- Change Language
- Enable/Disable Notifications

---

### 4.2 Admin Use Case (Web)
**File:** `Diagrams/admin-usecase-updated.png`

**Instructions:**
Update admin use case diagram to include:

**New use cases:**
- Verify Users (Identity verification)
- Review Reports
- Manage Reviews
- View Analytics Dashboard
- Export Transaction Data
- Manage Notification Templates
- Block/Unblock Users
- Feature Products

---

## 5. SEQUENCE DIAGRAMS (Updated)

### 5.1 Mobile Login Sequence Diagram
**File:** `Diagrams/mobile-login-sequence.png`

**Instructions:**
Create sequence diagram for mobile login:

**Actors:** User, Mobile App, Firebase Auth, Backend API, Database

**Flow:**
1. User taps "Sign in with Google"
2. App calls Firebase Auth
3. Firebase shows Google sign-in
4. User authenticates
5. Firebase returns ID token
6. App sends token to Backend
7. Backend verifies token with Firebase
8. Backend checks if user exists in DB
9. If not, create user record
10. Backend generates JWT
11. Returns JWT to app
12. App stores JWT in AsyncStorage
13. Navigate to Home screen

---

### 5.2 Place Bid Sequence Diagram (Mobile + Real-time)
**File:** `Diagrams/place-bid-sequence-mobile.png`

**Instructions:**
Update bidding sequence diagram to show mobile and WebSocket:

**Actors:** User A (Mobile), User B (Web), WebSocket Server, Backend, Database

**Flow:**
1. User A enters bid on mobile
2. Mobile validates input
3. Sends POST to /api/bidding/placebid
4. Backend validates bid
5. Saves to Database
6. Emits WebSocket event 'bid_placed'
7. User A receives confirmation
8. User B (web) receives WebSocket update
9. Both UIs update with new price

---

### 5.3 Product Creation with Image Upload Sequence
**File:** `Diagrams/product-creation-sequence.png`

**Instructions:**
Create sequence diagram for adding product with images:

**Actors:** User, Mobile App, Backend, Cloudinary, MongoDB

**Flow:**
1. User selects images from gallery
2. App shows preview
3. User fills form
4. App sends multipart/form-data
5. Backend receives request
6. For each image:
   - Upload to Cloudinary
   - Get image URL
7. Create product document with image URLs
8. Save to MongoDB
9. Return product object
10. App shows success message

---

## 6. STATE DIAGRAMS (Updated)

### 6.1 Product State Diagram
**File:** `Diagrams/product-state-diagram.png`

**Instructions:**
Create state diagram showing product lifecycle:

**States:**
- Draft (not published)
- Pending (awaiting approval)
- Active (auction running)
- Ended (auction finished)
- Sold (winner paid)
- Cancelled (seller cancelled)
- Expired (no bids)

**Transitions:**
- Draft → Pending (submit)
- Pending → Active (admin approve)
- Pending → Cancelled (admin reject)
- Active → Ended (time expired)
- Ended → Sold (winner pays)
- Ended → Expired (no bids)
- Active → Cancelled (seller cancels)

---

### 6.2 Auction Status State Diagram
**File:** `Diagrams/auction-status-state.png`

**Instructions:**
Create state diagram for auction status:

**States:**
- Scheduled (future start date)
- Live (currently running)
- Ending Soon (< 1 hour left)
- Ended (time expired)
- Completed (transaction done)

---

## 7. ACTIVITY DIAGRAMS (Updated)

### 7.1 User Registration Activity Diagram (Mobile)
**File:** `Diagrams/mobile-registration-activity.png`

**Instructions:**
Update registration activity diagram for mobile:

**Swimlanes:** User, Mobile App, Backend, Firebase/Google

**Activities:**
- Start
- Choose registration method
- [Email] Enter email/password → Verify email → Register
- [Google] Authenticate with Google → Register
- [Phone] Enter phone → Receive code → Verify → Register
- Save token
- Navigate to home
- End

---

### 7.2 Mobile Product Browsing Activity
**File:** `Diagrams/mobile-browse-activity.png`

**Instructions:**
Create activity diagram for browsing products on mobile:

**Activities:**
- Open app
- View home screen with featured products
- Scroll through products
- Filter by category
- Search by keyword
- View product details
- Add to watchlist
- Place bid or go back

---

## 8. COMPONENT DIAGRAMS

### 8.1 Mobile App Component Diagram
**File:** `Diagrams/mobile-components.png`

**Instructions:**
Create component diagram showing mobile app structure:

**Components:**
```
┌─────────────────────────────────────┐
│      Mobile App (Expo)              │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────────────────────┐  │
│  │   Navigation                 │  │
│  │  - Tab Navigator             │  │
│  │  - Stack Navigator           │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   Screens                    │  │
│  │  - Home                      │  │
│  │  - Search                    │  │
│  │  - Product Detail            │  │
│  │  - Add Product               │  │
│  │  - Profile                   │  │
│  │  - Login/Register            │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   Components                 │  │
│  │  - ProductCard               │  │
│  │  - AuctionCard               │  │
│  │  - CategoryIcon              │  │
│  │  - Header                    │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   Services                   │  │
│  │  - API Client                │  │
│  │  - WebSocket Client          │  │
│  │  - Auth Service              │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   Context/State              │  │
│  │  - AuthContext               │  │
│  │  - LanguageContext           │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

### 8.2 Backend Component Diagram
**File:** `Diagrams/backend-components.png`

**Instructions:**
Create component diagram for backend structure:

**Components:**
- Controllers (User, Product, Bidding, Category)
- Models (Mongoose schemas)
- Routes (API endpoints)
- Middleware (Auth, Error handling)
- Services (Email, Notification, WebSocket)
- Utils (Helpers, Validators)

---

## 9. DEPLOYMENT DIAGRAM

### 9.1 Deployment Architecture
**File:** `Diagrams/deployment-architecture.png`

**Instructions:**
Create deployment diagram showing how system is deployed:

**Nodes:**
```
┌─────────────────────────────────────────────────────┐
│              Client Devices                         │
├────────────┬────────────┬───────────────────────────┤
│ iOS Devices│Android Dev │ Web Browsers             │
└─────┬──────┴─────┬──────┴──────┬────────────────────┘
      │            │             │
      └────────────┼─────────────┘
                   │ HTTPS
      ┌────────────▼────────────┐
      │   ngrok (Development)   │
      │   or                    │
      │   Cloud Server (Prod)   │
      └────────────┬────────────┘
                   │
      ┌────────────▼────────────┐
      │  Node.js Server         │
      │  - Express.js           │
      │  - Socket.io            │
      │  - Port: 5000           │
      └──┬───────────────────┬──┘
         │                   │
    ┌────▼─────┐      ┌──────▼────┐
    │ MongoDB  │      │Cloudinary │
    │ Database │      │  CDN      │
    └──────────┘      └───────────┘
```

---

## 10. UI MOCKUPS / WIREFRAMES

### 10.1 Mobile App Screen Flow
**File:** `Diagrams/mobile-screen-flow.png`

**Instructions:**
Create a visual flow of mobile app screens:

**Screens to show:**
1. Splash Screen
2. Login Screen (with Google, Phone, Email options)
3. Home Screen (with tabs)
4. Product Detail Screen
5. Add Product Screen
6. Search Screen
7. Profile Screen
8. Settings Screen

**Show navigation arrows between screens**

---

### 10.2 Web App Screen Flow
**File:** `Diagrams/web-screen-flow.png`

**Instructions:**
Create a visual flow of web app screens:

**Screens:**
1. Landing Page
2. Product Listing
3. Product Detail
4. User Dashboard
5. Add Product (with rich text editor)
6. Admin Dashboard

---

## 11. NETWORK DIAGRAMS

### 11.1 API Endpoint Map
**File:** `Diagrams/api-endpoint-map.png`

**Instructions:**
Create a diagram showing all API endpoints organized by resource:

**Format:**
```
/api
├── /users
│   ├── POST /register
│   ├── POST /login
│   ├── POST /logout
│   ├── GET /profile
│   ├── PUT /profile
│   ├── GET /userbalance
│   ├── POST /addBalance
│   ├── POST /send-code
│   ├── POST /verify-email
│   ├── POST /forgot-password
│   ├── GET /verify-reset-token/:token
│   └── POST /reset-password/:token
│
├── /product
│   ├── POST /add
│   ├── GET /all
│   ├── GET /:id
│   ├── PUT /:id
│   ├── DELETE /:id
│   ├── GET /search
│   ├── GET /category/:categoryId
│   └── GET /user/:userId
│
├── /bidding
│   ├── POST /placebid
│   ├── GET /history/:productId
│   └── GET /user-bids
│
├── /category
│   ├── GET /all
│   ├── POST /add (admin)
│   ├── PUT /:id (admin)
│   └── DELETE /:id (admin)
│
└── /watchlist
    ├── POST /add
    ├── DELETE /remove/:productId
    └── GET /user
```

---

## 12. DATA FLOW DIAGRAMS

### 12.1 Level 0 DFD (Context Diagram)
**File:** `Diagrams/dfd-level-0.png`

**Instructions:**
Create context diagram showing system and external entities:

**External Entities:**
- User (Buyer/Seller)
- Admin
- External Services (Google, Firebase, Cloudinary)

**System:** Online Auction Platform

**Data Flows:**
- User → System: Product data, Bids, Registration info
- System → User: Product listings, Notifications, Auction results
- Admin → System: Management commands
- System → External Services: Auth requests, Image uploads

---

### 12.2 Level 1 DFD
**File:** `Diagrams/dfd-level-1.png`

**Instructions:**
Create detailed DFD showing processes:

**Processes:**
1. User Authentication
2. Product Management
3. Bidding Process
4. Notification Service
5. Payment Processing
6. Search & Filter

**Data Stores:**
- Users Database
- Products Database
- Bids Database
- Transactions Database

---

## 13. COMPARISON DIAGRAMS

### 13.1 Technology Stack Comparison
**File:** `Diagrams/technology-comparison.png`

**Instructions:**
Create a comparison table/diagram:

| Layer | Our System | eBay | Yahoo Auction | Mercari |
|-------|------------|------|---------------|---------|
| Frontend | React.js, React Native | Custom | Custom | Custom |
| Backend | Node.js, Express | Java, Node.js | PHP, Java | Ruby, Go |
| Database | MongoDB | Oracle, NoSQL | MySQL | PostgreSQL |
| Real-time | Socket.io | Polling | Polling | WebSocket |
| Mobile | React Native | Native iOS/Android | Native | Native |

---

### 13.2 Feature Comparison Matrix
**File:** `Diagrams/feature-comparison.png`

**Instructions:**
Create matrix comparing features:

| Feature | Our System | eBay | Yahoo JP | Mercari |
|---------|-----------|------|----------|---------|
| Real-time Bidding | ✓ | ✗ | ✗ | ✓ |
| Mobile App | ✓ | ✓ | ✓ | ✓ |
| AI Category Suggest | ✓ | ✗ | ✗ | ✗ |
| Multi-language | ✓ | ✓ | Limited | Limited |
| Rich Text Editor | ✓ | ✓ | ✓ | ✗ |
| Watchlist | ✓ | ✓ | ✓ | ✓ |
| Price History Chart | ✓ | ✓ | ✗ | ✗ |

---

## TOOL RECOMMENDATIONS:

### For UML Diagrams:
- **draw.io (diagrams.net)** - Free, web-based
- **Lucidchart** - Professional, templates available
- **PlantUML** - Code-based, good for version control
- **StarUML** - Desktop application

### For Wireframes:
- **Figma** - Modern, collaborative
- **Adobe XD** - Professional
- **Balsamiq** - Quick sketches

### For Screenshots:
- **Snipping Tool** (Windows)
- **Screenshot** (Mac)
- **Lightshot** - Cross-platform

### For Editing:
- **GIMP** - Free Photoshop alternative
- **Paint.NET** - Simple Windows editor
- **Photopea** - Web-based Photoshop clone

---

## DIAGRAM STYLE GUIDE:

**Consistency Rules:**
1. Use same color scheme across all diagrams
2. Recommended colors:
   - Primary: #3B82F6 (blue)
   - Secondary: #10B981 (green)
   - Warning: #F59E0B (amber)
   - Error: #EF4444 (red)
   - Background: #F9FAFB (light gray)

3. Font: Use Arial or similar sans-serif
4. Font sizes:
   - Title: 18-20pt
   - Headers: 14-16pt
   - Body: 11-12pt

5. Borders: 2px solid lines
6. Arrows: Use simple arrow heads
7. Alignment: Always align elements to grid

---

## CHECKLIST:

### Architecture Diagrams
- [ ] system-architecture.png
- [ ] mobile-architecture.png
- [ ] realtime-bidding-flow.png
- [ ] deployment-architecture.png
- [ ] backend-components.png
- [ ] mobile-components.png

### Data Diagrams
- [ ] erd-updated.png
- [ ] database-schema.png
- [ ] dfd-level-0.png
- [ ] dfd-level-1.png

### Workflow Diagrams
- [ ] mobile-registration-flow.png
- [ ] mobile-product-creation-flow.png
- [ ] bidding-process-flow.png
- [ ] auction-end-flow.png

### UML Diagrams
- [ ] mobile-user-usecase.png
- [ ] admin-usecase-updated.png
- [ ] mobile-login-sequence.png
- [ ] place-bid-sequence-mobile.png
- [ ] product-creation-sequence.png
- [ ] product-state-diagram.png
- [ ] auction-status-state.png
- [ ] mobile-registration-activity.png
- [ ] mobile-browse-activity.png

### UI/UX Diagrams
- [ ] mobile-screen-flow.png
- [ ] web-screen-flow.png
- [ ] api-endpoint-map.png

### Comparison Diagrams
- [ ] technology-comparison.png
- [ ] feature-comparison.png

---

## PRIORITY ORDER:

### HIGH PRIORITY (Do First):
1. system-architecture.png
2. mobile-architecture.png
3. erd-updated.png
4. mobile-screen-flow.png
5. realtime-bidding-flow.png

### MEDIUM PRIORITY:
6. All sequence diagrams
7. All use case diagrams
8. database-schema.png
9. deployment-architecture.png

### LOW PRIORITY (Nice to have):
10. Comparison diagrams
11. Component diagrams
12. DFD diagrams

**Note:** Focus on diagrams that show mobile app functionality since that's the main focus of the thesis!
