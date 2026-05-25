# Postman API Testing Guide - Online Auction System

## Setup Instructions

### 1. Start the Backend Server
```bash
cd backend
npm install
npm start
# Server runs on http://localhost:5000
```

### 2. Import Environment Variables in Postman

Create a new environment in Postman with these variables:
- `baseURL`: `http://localhost:5000/api`
- `token`: (will be set after login)
- `userId`: (will be set after login)
- `productId`: (will be set after creating a product)

---

## API Endpoints Collection

### 📁 1. USER MANAGEMENT (/api/users)

#### 1.1 Register New User
```
POST {{baseURL}}/users/register
Content-Type: application/json

Body (JSON):
{
  "name": "Test User",
  "email": "testuser@example.com",
  "password": "Password123!",
  "phone": "+97699887766"
}

Expected Response: 201
{
  "_id": "...",
  "name": "Test User",
  "email": "testuser@example.com",
  "token": "..."
}
```

#### 1.2 Login User
```
POST {{baseURL}}/users/login
Content-Type: application/json

Body (JSON):
{
  "email": "testuser@example.com",
  "password": "Password123!"
}

Expected Response: 200
{
  "token": "...",
  "user": {
    "_id": "...",
    "name": "Test User",
    "email": "testuser@example.com"
  }
}

⚠️ Save the token to environment variable: token
```

#### 1.3 Get Current User
```
GET {{baseURL}}/users/getuser
Authorization: Bearer {{token}}

Expected Response: 200
{
  "_id": "...",
  "name": "Test User",
  "email": "testuser@example.com",
  "balance": 0
}
```

#### 1.4 Check Login Status
```
GET {{baseURL}}/users/loggedin

Expected Response: 200
{ "loggedin": true }
```

#### 1.5 Get User Balance
```
GET {{baseURL}}/users/userbalance
Authorization: Bearer {{token}}

Expected Response: 200
{
  "balance": 0
}
```

#### 1.6 Add Test Funds (for testing bidding)
```
POST {{baseURL}}/users/add-test-funds
Authorization: Bearer {{token}}
Content-Type: application/json

Body (JSON):
{
  "amount": 100000
}

Expected Response: 200
{
  "message": "Test funds added successfully",
  "balance": 100000
}
```

#### 1.7 Google Login (Web)
```
POST {{baseURL}}/users/google
Content-Type: application/json

Body (JSON):
{
  "credential": "GOOGLE_ID_TOKEN_HERE"
}
```

#### 1.8 Google Login (Mobile)
```
POST {{baseURL}}/users/google-mobile
Content-Type: application/json

Body (JSON):
{
  "idToken": "GOOGLE_ID_TOKEN_HERE"
}
```

#### 1.9 Forgot Password
```
POST {{baseURL}}/users/forgot-password
Content-Type: application/json

Body (JSON):
{
  "email": "testuser@example.com"
}
```

#### 1.10 Logout
```
GET {{baseURL}}/users/loggout
```

---

### 📁 2. PRODUCT MANAGEMENT (/api/product)

#### 2.1 Get All Available Products
```
GET {{baseURL}}/product/products

Expected Response: 200
[
  {
    "_id": "...",
    "title": "Product Title",
    "description": "...",
    "startingPrice": 50000,
    "currentPrice": 50000,
    "images": [...],
    "category": "...",
    "status": "available"
  }
]
```

#### 2.2 Create New Product (with images)
```
POST {{baseURL}}/product
Authorization: Bearer {{token}}
Content-Type: multipart/form-data

Body (form-data):
- title: "Samsung Galaxy S21"
- description: "Шинэ утас, хэрэглээгүй"
- startingPrice: 500000
- category: "Electronics"
- condition: "new"
- auctionStartTime: "2025-12-17T10:00:00Z"
- auctionEndTime: "2025-12-20T18:00:00Z"
- images[0]: (file upload)
- images[1]: (file upload)

Expected Response: 201
{
  "_id": "...",
  "title": "Samsung Galaxy S21",
  "seller": "...",
  "status": "draft" or "scheduled"
}

⚠️ Save _id to environment variable: productId
```

#### 2.3 Get Product by ID
```
GET {{baseURL}}/product/{{productId}}

Expected Response: 200
{
  "_id": "...",
  "title": "...",
  "description": "...",
  "seller": {...},
  "biddingHistory": [...],
  "status": "available"
}
```

#### 2.4 Update Product
```
PUT {{baseURL}}/product/{{productId}}
Authorization: Bearer {{token}}
Content-Type: application/json

Body (JSON):
{
  "title": "Samsung Galaxy S21 - Updated",
  "description": "Updated description",
  "startingPrice": 450000
}
```

#### 2.5 Delete Product
```
DELETE {{baseURL}}/product/{{productId}}
Authorization: Bearer {{token}}

Expected Response: 200
{ "message": "Product deleted successfully" }
```

#### 2.6 Get My Products
```
GET {{baseURL}}/product/my
Authorization: Bearer {{token}}

Expected Response: 200
[...user's products...]
```

#### 2.7 Get My Active Auctions
```
GET {{baseURL}}/product/my/active
Authorization: Bearer {{token}}
```

#### 2.8 Get My Scheduled Auctions
```
GET {{baseURL}}/product/my/scheduled
Authorization: Bearer {{token}}
```

#### 2.9 Get My Sold Auctions
```
GET {{baseURL}}/product/my/sold
Authorization: Bearer {{token}}
```

#### 2.10 Get Similar Products
```
GET {{baseURL}}/product/{{productId}}/similar

Expected Response: 200
[...similar products based on category...]
```

#### 2.11 Get Recommended Products
```
GET {{baseURL}}/product/recommended
Authorization: Bearer {{token}}

Expected Response: 200
[...personalized recommendations...]
```

#### 2.12 Buy Now (if available)
```
POST {{baseURL}}/product/{{productId}}/buy-now
Authorization: Bearer {{token}}

Expected Response: 200
{
  "message": "Product purchased successfully",
  "transaction": {...}
}
```

#### 2.13 AI Category Suggestion
```
POST {{baseURL}}/product/suggest-category
Content-Type: application/json

Body (JSON):
{
  "title": "Утас Samsung Galaxy",
  "description": "Гар утас сайн байдалтай"
}

Expected Response: 200
{
  "suggestedCategory": "Electronics",
  "confidence": 0.95
}
```

---

### 📁 3. BIDDING (/api/bidding)

#### 3.1 Place a Bid
```
POST {{baseURL}}/bidding
Authorization: Bearer {{token}}
Content-Type: application/json

Body (JSON):
{
  "productId": "{{productId}}",
  "bidAmount": 550000
}

Expected Response: 201
{
  "message": "Bid placed successfully",
  "bid": {
    "_id": "...",
    "bidder": "...",
    "bidAmount": 550000,
    "timestamp": "..."
  }
}
```

#### 3.2 Get Bidding History for Product
```
GET {{baseURL}}/bidding/{{productId}}

Expected Response: 200
[
  {
    "bidder": {...},
    "bidAmount": 550000,
    "timestamp": "2025-12-17T10:30:00Z"
  }
]
```

#### 3.3 Get My Bids
```
GET {{baseURL}}/bidding/my
Authorization: Bearer {{token}}

Expected Response: 200
[...all user's bids...]
```

#### 3.4 Get My Wins
```
GET {{baseURL}}/bidding/my-wins
Authorization: Bearer {{token}}

Expected Response: 200
[...auctions user won...]
```

#### 3.5 Get My Losses
```
GET {{baseURL}}/bidding/my-losses
Authorization: Bearer {{token}}

Expected Response: 200
[...auctions user participated but lost...]
```

#### 3.6 Check User Bid Status
```
GET {{baseURL}}/bidding/check-bid-status/{{productId}}
Authorization: Bearer {{token}}

Expected Response: 200
{
  "hasBid": true,
  "isWinning": true,
  "currentBid": 550000
}
```

---

### 📁 4. CATEGORY MANAGEMENT (/api/category)

#### 4.1 Get All Categories
```
GET {{baseURL}}/category

Expected Response: 200
[
  {
    "_id": "...",
    "name": "Electronics",
    "mongolianName": "Цахилгаан бараа",
    "subcategories": [...]
  }
]
```

#### 4.2 Create Category (Admin)
```
POST {{baseURL}}/category
Authorization: Bearer {{token}}
Content-Type: application/json

Body (JSON):
{
  "name": "Books",
  "mongolianName": "Ном",
  "description": "Books and magazines"
}
```

---

### 📁 5. SEARCH (/api/search)

#### 5.1 Search Products
```
GET {{baseURL}}/search?q=samsung&category=Electronics&minPrice=100000&maxPrice=1000000

Query Parameters:
- q: search keyword
- category: category filter
- minPrice: minimum price
- maxPrice: maximum price
- condition: new/used
- sort: price_asc, price_desc, date_new, date_old

Expected Response: 200
{
  "results": [...],
  "total": 25,
  "page": 1
}
```

---

### 📁 6. LIKES (/api/likes)

#### 6.1 Like a Product
```
POST {{baseURL}}/likes/{{productId}}
Authorization: Bearer {{token}}

Expected Response: 200
{ "message": "Product liked" }
```

#### 6.2 Unlike a Product
```
DELETE {{baseURL}}/likes/{{productId}}
Authorization: Bearer {{token}}

Expected Response: 200
{ "message": "Product unliked" }
```

#### 6.3 Get My Liked Products
```
GET {{baseURL}}/likes
Authorization: Bearer {{token}}

Expected Response: 200
[...liked products...]
```

---

### 📁 7. WATCHLIST (/api/watchlist)

#### 7.1 Add to Watchlist
```
POST {{baseURL}}/watchlist/{{productId}}
Authorization: Bearer {{token}}
```

#### 7.2 Remove from Watchlist
```
DELETE {{baseURL}}/watchlist/{{productId}}
Authorization: Bearer {{token}}
```

#### 7.3 Get My Watchlist
```
GET {{baseURL}}/watchlist
Authorization: Bearer {{token}}
```

---

### 📁 8. NOTIFICATIONS (/api/notifications)

#### 8.1 Get My Notifications
```
GET {{baseURL}}/notifications
Authorization: Bearer {{token}}

Expected Response: 200
[
  {
    "_id": "...",
    "type": "bid_outbid",
    "message": "You have been outbid on Samsung Galaxy S21",
    "read": false,
    "createdAt": "..."
  }
]
```

#### 8.2 Mark Notification as Read
```
PUT {{baseURL}}/notifications/{{notificationId}}/read
Authorization: Bearer {{token}}
```

#### 8.3 Mark All as Read
```
PUT {{baseURL}}/notifications/read-all
Authorization: Bearer {{token}}
```

#### 8.4 Delete Notification
```
DELETE {{baseURL}}/notifications/{{notificationId}}
Authorization: Bearer {{token}}
```

---

### 📁 9. REVIEWS (/api/reviews)

#### 9.1 Create Review for Seller
```
POST {{baseURL}}/reviews
Authorization: Bearer {{token}}
Content-Type: application/json

Body (JSON):
{
  "sellerId": "USER_ID_HERE",
  "productId": "{{productId}}",
  "rating": 5,
  "comment": "Great seller, fast shipping!"
}
```

#### 9.2 Get Reviews for Seller
```
GET {{baseURL}}/reviews/seller/{{sellerId}}
```

---

### 📁 10. TRANSACTIONS (/api/transaction)

#### 10.1 Get My Transactions
```
GET {{baseURL}}/transaction
Authorization: Bearer {{token}}

Expected Response: 200
[
  {
    "_id": "...",
    "product": {...},
    "buyer": {...},
    "seller": {...},
    "amount": 550000,
    "status": "completed",
    "createdAt": "..."
  }
]
```

---

### 📁 11. PHONE AUTHENTICATION (/api/auth)

#### 11.1 Send Verification Code
```
POST {{baseURL}}/auth/send-code
Content-Type: application/json

Body (JSON):
{
  "phoneNumber": "+97699887766"
}
```

#### 11.2 Verify Phone Code
```
POST {{baseURL}}/auth/verify-code
Content-Type: application/json

Body (JSON):
{
  "phoneNumber": "+97699887766",
  "code": "123456"
}
```

---

### 📁 12. ADMIN ANALYTICS (/api/admin)

#### 12.1 Get System Analytics (Admin Only)
```
GET {{baseURL}}/admin/analytics
Authorization: Bearer {{token}}

Expected Response: 200
{
  "totalUsers": 150,
  "totalProducts": 450,
  "totalTransactions": 89,
  "revenue": 15000000
}
```

---

## Testing Workflow

### Test Scenario 1: Complete Auction Flow

1. **Register two users** (User A - Seller, User B - Bidder)
2. **Login as User A**, save token
3. **Add test funds** to User A (100,000₮)
4. **Create a product** as User A
5. **Get product details** - verify it's created
6. **Login as User B**, save token
7. **Add test funds** to User B (200,000₮)
8. **Place a bid** as User B
9. **Get bidding history** - verify bid is recorded
10. **Check bid status** as User B
11. **Get my bids** as User B
12. **Like the product** as User B
13. **Add to watchlist** as User B
14. **Search for products** by keyword
15. **Get notifications** for both users

### Test Scenario 2: Mobile-Specific Features

1. **Google Mobile Login** - Test mobile OAuth
2. **Phone Authentication** - Send and verify code
3. **AI Category Suggestion** - Test with Mongolian text
4. **Get recommended products** - Test personalization
5. **Real-time bidding** - Test WebSocket connection (need Socket.io client)

---

## Expected Screenshots for Thesis

1. **Postman Collection Overview** - All folders
2. **User Registration** - Request + Response
3. **User Login** - Request + Response
4. **Create Product** - Request with images
5. **Place Bid** - Request + Response
6. **Bidding History** - Response showing multiple bids
7. **Get Notifications** - Response
8. **Search Results** - Response with filters
9. **AI Category Suggestion** - Request + Response
10. **User Balance** - Response

---

## Notes

- All endpoints requiring authentication need `Authorization: Bearer {{token}}` header
- Image uploads use `multipart/form-data`
- JSON requests use `Content-Type: application/json`
- WebSocket testing requires Socket.io client (separate from Postman)
- Remember to add test funds before testing bidding features
- Some endpoints require admin privileges

---

## Common Errors

| Status Code | Error | Solution |
|-------------|-------|----------|
| 401 | Unauthorized | Add valid token to Authorization header |
| 403 | Forbidden | User doesn't have permission (admin required) |
| 404 | Not Found | Check product/user ID is correct |
| 400 | Bad Request | Check request body format |
| 500 | Server Error | Check backend logs, verify database connection |

---

## Save This Collection

After creating all requests in Postman:
1. Click on the collection name
2. Click "..." → Export
3. Save as `Online-Auction-API-Collection.json`
4. Take screenshot of the exported collection structure for thesis
