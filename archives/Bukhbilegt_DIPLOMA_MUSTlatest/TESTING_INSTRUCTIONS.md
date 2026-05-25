# Testing Instructions for Online Auction System

This document provides detailed instructions for all tests that need to be performed for the thesis. Take screenshots of each test result and save them in the `Diagrams/` folder.

## 1. BACKEND API TESTING (Using Insomnia)

### 1.1 User Registration API Test
**Endpoint:** `POST /api/users/register`

**Instructions:**
1. Open Insomnia
2. Create a new POST request to `http://localhost:5000/api/users/register`
3. Set Content-Type to JSON
4. Body:
```json
{
  "name": "Test User",
  "email": "testuser@example.com",
  "password": "testpassword123",
  "phone": "+976-99887766"
}
```
5. Send the request
6. **Screenshot:** Save as `Diagrams/register-api-test.png`
7. Expected: 201 status, user object with JWT token

---

### 1.2 User Login API Test
**Endpoint:** `POST /api/users/login`

**Instructions:**
1. Create a new POST request to `http://localhost:5000/api/users/login`
2. Body:
```json
{
  "email": "testuser@example.com",
  "password": "testpassword123"
}
```
3. Send the request
4. **Screenshot:** Save as `Diagrams/login-api-test.png`
5. Expected: 200 status, JWT token, user details

---

### 1.3 Add Product API Test
**Endpoint:** `POST /api/product/add`

**Instructions:**
1. Create a new POST request to `http://localhost:5000/api/product/add`
2. Add Authorization header: `Bearer [JWT_TOKEN_FROM_LOGIN]`
3. Set Content-Type to form-data
4. Add fields:
   - title: "Test Product"
   - description: "Test Description"
   - category: [CATEGORY_ID]
   - startingPrice: 10000
   - startDate: [CURRENT_DATE]
   - endDate: [FUTURE_DATE]
   - images: [Upload 2-3 test images]
5. Send the request
6. **Screenshot:** Save as `Diagrams/add-product-api-test.png`
7. Expected: 201 status, product object created

---

### 1.4 Place Bid API Test
**Endpoint:** `POST /api/bidding/placebid`

**Instructions:**
1. Create a new POST request to `http://localhost:5000/api/bidding/placebid`
2. Add Authorization header: `Bearer [JWT_TOKEN]`
3. Body:
```json
{
  "productId": "[PRODUCT_ID_FROM_PREVIOUS_TEST]",
  "bidAmount": 15000
}
```
4. Send the request
5. **Screenshot:** Save as `Diagrams/place-bid-api-test.png`
6. Expected: 200 status, updated bid information

---

### 1.5 Get All Products API Test
**Endpoint:** `GET /api/product/all`

**Instructions:**
1. Create a new GET request to `http://localhost:5000/api/product/all`
2. Send the request
3. **Screenshot:** Save as `Diagrams/get-products-api-test.png`
4. Expected: 200 status, array of products

---

### 1.6 Get User Balance API Test
**Endpoint:** `GET /api/users/userbalance`

**Instructions:**
1. Create a new GET request to `http://localhost:5000/api/users/userbalance`
2. Add Authorization header: `Bearer [JWT_TOKEN]`
3. Send the request
4. **Screenshot:** Save as `Diagrams/user-balance-api-test.png`
5. Expected: 200 status, user balance information

---

## 2. UNIT TESTING (Jest)

### 2.1 BiddingController Unit Tests

**File:** `backend/__tests__/biddingController.test.js`

**Instructions:**
1. Create test file with the following test cases:
   - Test: Place bid with valid data
   - Test: Place bid with amount lower than current highest bid (should fail)
   - Test: Place bid without authentication (should fail)
   - Test: Place bid on non-existent product (should fail)
   - Test: Place bid on expired auction (should fail)
   - Test: Get bid history for a product
   - Test: Get user's bid history

2. Run tests: `npm test biddingController.test.js`
3. **Screenshot:** Save terminal output as `Diagrams/bidding-unit-test-results.png`

**Code skeleton to implement:**
```javascript
describe('BiddingController', () => {
  describe('placeBid', () => {
    test('should place bid successfully with valid data', async () => {
      // TODO: Mock request with valid bid data
      // TODO: Call placeBid controller
      // TODO: Assert status 200
      // TODO: Assert bid is saved in database
    });

    test('should reject bid lower than current highest', async () => {
      // TODO: Implement
    });
  });
});
```

---

### 2.2 UserController Unit Tests

**File:** `backend/__tests__/userController.test.js`

**Instructions:**
1. Create test file with the following test cases:
   - Test: Register new user with valid data
   - Test: Register user with existing email (should fail)
   - Test: Login with valid credentials
   - Test: Login with invalid credentials (should fail)
   - Test: Forgot password - send reset email
   - Test: Reset password with valid token
   - Test: Update user profile
   - Test: Add balance to user account
   - Test: Get all users (admin only)

2. Run tests: `npm test userController.test.js`
3. **Screenshot:** Save terminal output as `Diagrams/user-unit-test-results.png`

---

### 2.3 ProductController Unit Tests

**File:** `backend/__tests__/productController.test.js`

**Instructions:**
1. Create test file with the following test cases:
   - Test: Create product with valid data
   - Test: Create product without authentication (should fail)
   - Test: Get all products
   - Test: Get single product by ID
   - Test: Update product (owner only)
   - Test: Delete product (owner only)
   - Test: Search products by keyword
   - Test: Filter products by category
   - Test: Get products by user
   - Test: Get trending products

2. Run tests: `npm test productController.test.js`
3. **Screenshot:** Save terminal output as `Diagrams/product-unit-test-results.png`

---

## 3. INTEGRATION TESTING

### 3.1 User Registration and Login Flow Integration Test

**Instructions:**
1. Create integration test that:
   - Registers a new user
   - Verifies user is saved in database
   - Logs in with the registered user
   - Verifies JWT token is returned
   - Uses token to access protected route

2. Run test
3. **Screenshot:** Save as `Diagrams/register-login-integration-test.png`

**Code skeleton:**
```javascript
describe('User Registration and Login Integration', () => {
  test('should register, login, and access protected route', async () => {
    // Step 1: Register user
    // Step 2: Verify in database
    // Step 3: Login
    // Step 4: Access protected route with token
  });
});
```

---

### 3.2 Product Creation and Bidding Flow Integration Test

**Instructions:**
1. Create integration test that:
   - User logs in
   - Creates a product
   - Another user places a bid
   - Verifies bid is saved
   - Verifies product's current price is updated
   - Verifies bid history is recorded

2. Run test
3. **Screenshot:** Save as `Diagrams/product-bidding-integration-test.png`

---

### 3.3 Complete Auction Flow Integration Test

**Instructions:**
1. Create integration test that:
   - Seller creates product
   - Multiple buyers place bids
   - Auction ends
   - Winner is determined
   - Seller and winner are notified

2. Run test
3. **Screenshot:** Save as `Diagrams/complete-auction-flow-test.png`

---

## 4. MOBILE APP TESTING

### 4.1 Expo Go Testing on Real Devices

**Instructions for iOS:**
1. Install Expo Go from App Store
2. Run `npm start` in mobile/auctionapp directory
3. Scan QR code with iPhone camera
4. App opens in Expo Go
5. **Screenshot:** Take screenshot of app running on iPhone
   - Save as `Diagrams/mobile-ios-expo-test.png`

**Instructions for Android:**
1. Install Expo Go from Google Play Store
2. Run `npm start` in mobile/auctionapp directory
3. Scan QR code with Expo Go app
4. App opens
5. **Screenshot:** Take screenshot of app running on Android
   - Save as `Diagrams/mobile-android-expo-test.png`

---

### 4.2 Mobile Authentication Testing

**Test: Google OAuth Login**
**Instructions:**
1. Open app on mobile device
2. Navigate to Login screen
3. Tap "Sign in with Google"
4. Complete Google authentication
5. Verify user is logged in
6. **Screenshots:**
   - Login screen: `Diagrams/mobile-login-screen.png`
   - Google auth screen: `Diagrams/mobile-google-auth.png`
   - Logged in home screen: `Diagrams/mobile-logged-in-home.png`

**Test: Phone Number Authentication**
**Instructions:**
1. Open app
2. Navigate to Register screen
3. Enter phone number
4. Receive verification code
5. Enter verification code
6. Complete registration
7. **Screenshots:**
   - Phone entry: `Diagrams/mobile-phone-entry.png`
   - Code verification: `Diagrams/mobile-code-verify.png`

---

### 4.3 Mobile Product Management Testing

**Test: Add Product from Mobile**
**Instructions:**
1. Log in to app
2. Navigate to "Selling" tab
3. Tap "Add Product" button
4. Fill in product details:
   - Take/upload photos (test 3-5 images)
   - Enter title
   - Enter description
   - Select category
   - Enter starting price
   - Set auction duration
5. Submit product
6. Verify product appears in listings
7. **Screenshots:**
   - Add product form: `Diagrams/mobile-add-product-form.png`
   - Image upload: `Diagrams/mobile-image-upload.png`
   - Category selection: `Diagrams/mobile-category-select.png`
   - Success message: `Diagrams/mobile-product-added-success.png`

---

### 4.4 Mobile Bidding Testing

**Test: Place Bid on Mobile**
**Instructions:**
1. Log in to app
2. Browse products
3. Tap on a product
4. View product details
5. Enter bid amount
6. Confirm bid
7. Verify real-time price update
8. **Screenshots:**
   - Product detail screen: `Diagrams/mobile-product-detail.png`
   - Bid entry: `Diagrams/mobile-bid-entry.png`
   - Bid confirmation: `Diagrams/mobile-bid-confirm.png`
   - Updated price: `Diagrams/mobile-price-updated.png`

---

### 4.5 Mobile Search and Filter Testing

**Test: Search Products**
**Instructions:**
1. Navigate to Search tab
2. Enter search term
3. View search results
4. Apply filters (category, price range)
5. View filtered results
6. **Screenshots:**
   - Search screen: `Diagrams/mobile-search-screen.png`
   - Search results: `Diagrams/mobile-search-results.png`
   - Filters applied: `Diagrams/mobile-filters-applied.png`

---

### 4.6 Mobile Profile Management Testing

**Test: Edit Profile**
**Instructions:**
1. Navigate to Profile tab
2. View profile information
3. Tap edit profile
4. Update name, phone, photo
5. Save changes
6. Verify updates
7. **Screenshots:**
   - Profile screen: `Diagrams/mobile-profile-screen.png`
   - Edit profile: `Diagrams/mobile-edit-profile.png`
   - Updated profile: `Diagrams/mobile-profile-updated.png`

---

### 4.7 Mobile Real-time Updates Testing

**Test: Real-time Bid Updates**
**Instructions:**
1. Open app on two devices (or web + mobile)
2. Navigate to same product on both
3. Place bid from one device
4. Observe real-time update on second device
5. **Screenshots:**
   - Before bid: `Diagrams/mobile-before-bid.png`
   - After bid update: `Diagrams/mobile-after-bid-update.png`

---

### 4.8 Mobile Language Toggle Testing

**Test: Switch Language**
**Instructions:**
1. Open app
2. Navigate to Settings
3. Toggle language to Mongolian
4. Observe UI changes
5. Toggle back to English
6. **Screenshots:**
   - English UI: `Diagrams/mobile-english-ui.png`
   - Mongolian UI: `Diagrams/mobile-mongolian-ui.png`

---

## 5. WEB APPLICATION TESTING

### 5.1 Web User Interface Testing

**Test: Home Page**
**Instructions:**
1. Open browser to `http://localhost:3000`
2. Verify home page loads
3. Check navigation menu
4. Test responsive design (resize window)
5. **Screenshots:**
   - Desktop view: `Diagrams/web-home-desktop.png`
   - Tablet view: `Diagrams/web-home-tablet.png`
   - Mobile view: `Diagrams/web-home-mobile.png`

---

### 5.2 Web Product Browsing Testing

**Test: Browse Products**
**Instructions:**
1. Navigate to products page
2. View product grid
3. Click on a product
4. View product details
5. Check image gallery
6. View bid history
7. **Screenshots:**
   - Product grid: `Diagrams/web-product-grid.png`
   - Product details: `Diagrams/web-product-details.png`
   - Bid history: `Diagrams/web-bid-history.png`

---

### 5.3 Web Admin Dashboard Testing

**Test: Admin Functions**
**Instructions:**
1. Log in as admin
2. Access admin dashboard
3. Test features:
   - View all users
   - View all products
   - Approve/reject products
   - Manage categories
   - View transaction history
4. **Screenshots:**
   - Admin dashboard: `Diagrams/web-admin-dashboard.png`
   - User management: `Diagrams/web-admin-users.png`
   - Product management: `Diagrams/web-admin-products.png`
   - Category management: `Diagrams/web-admin-categories.png`

---

### 5.4 Web Rich Text Editor Testing

**Test: Create Product with Rich Text**
**Instructions:**
1. Navigate to Add Product page
2. Use TinyMCE editor to add:
   - Bold, italic text
   - Bullet lists
   - Links
   - Formatted description
3. Submit product
4. View product to verify formatting
5. **Screenshots:**
   - Rich text editor: `Diagrams/web-rich-text-editor.png`
   - Formatted product description: `Diagrams/web-formatted-description.png`

---

## 6. CROSS-PLATFORM TESTING

### 6.1 Feature Parity Testing

**Instructions:**
Create a comparison table testing the same features on Web, iOS, and Android:

| Feature | Web | iOS | Android | Notes |
|---------|-----|-----|---------|-------|
| User Registration | ✓ | ✓ | ✓ | |
| Google OAuth | ✓ | ✓ | ✓ | |
| Phone Auth | ✓ | ✓ | ✓ | |
| Add Product | ✓ | ✓ | ✓ | |
| Upload Images (max 20) | ✓ | ✓ | ✓ | |
| Place Bid | ✓ | ✓ | ✓ | |
| Real-time Updates | ✓ | ✓ | ✓ | |
| Search Products | ✓ | ✓ | ✓ | |
| Filter by Category | ✓ | ✓ | ✓ | |
| Watchlist | ✓ | ✓ | ✓ | |
| Notifications | ✓ | ✓ | ✓ | |
| Language Toggle | ✓ | ✓ | ✓ | |
| Profile Management | ✓ | ✓ | ✓ | |
| Balance Top-up | ✓ | ✓ | ✓ | |

**Screenshot:** Save completed table as `Diagrams/cross-platform-parity.png`

---

## 7. PERFORMANCE TESTING

### 7.1 Page Load Time Testing

**Instructions:**
1. Use browser DevTools (F12) → Network tab
2. Clear cache
3. Reload pages and measure load times:
   - Home page
   - Product listing page
   - Product detail page
   - User profile page
4. Record results in table
5. **Screenshot:** Network timing data as `Diagrams/web-performance-timing.png`

---

### 7.2 API Response Time Testing

**Instructions:**
1. In Insomnia, measure response times for:
   - GET /api/product/all
   - GET /api/product/:id
   - POST /api/bidding/placebid
   - GET /api/users/profile
2. Run each request 10 times
3. Calculate average response time
4. **Screenshot:** Save timing results as `Diagrams/api-response-times.png`

---

## 8. SECURITY TESTING

### 8.1 JWT Token Validation Testing

**Test: Access Protected Route Without Token**
**Instructions:**
1. In Insomnia, send request to `POST /api/product/add` without Authorization header
2. Expected: 401 Unauthorized
3. **Screenshot:** Save as `Diagrams/security-no-token-test.png`

**Test: Access Protected Route With Invalid Token**
**Instructions:**
1. Send request with invalid token: `Authorization: Bearer invalid_token_123`
2. Expected: 401 Unauthorized
3. **Screenshot:** Save as `Diagrams/security-invalid-token-test.png`

---

### 8.2 Password Encryption Testing

**Instructions:**
1. Register a user
2. Check MongoDB database
3. Verify password is hashed (not plain text)
4. **Screenshot:** MongoDB Compass showing hashed password as `Diagrams/security-password-hashed.png`

---

## 9. ERROR HANDLING TESTING

### 9.1 Network Error Testing

**Instructions:**
1. Open mobile app
2. Turn off WiFi/mobile data
3. Try to load products
4. Verify error message appears
5. Turn connection back on
6. Verify app recovers
7. **Screenshots:**
   - Error state: `Diagrams/mobile-network-error.png`
   - Recovered state: `Diagrams/mobile-network-recovered.png`

---

### 9.2 Form Validation Testing

**Instructions:**
1. Test registration form with:
   - Empty fields
   - Invalid email format
   - Short password
   - Mismatched passwords
2. Verify validation errors appear
3. **Screenshots:**
   - Validation errors: `Diagrams/form-validation-errors.png`

---

## 10. SCREENSHOT CHECKLIST

Make sure you have all these screenshots in the `Diagrams/` folder:

### API Testing
- [ ] register-api-test.png
- [ ] login-api-test.png
- [ ] add-product-api-test.png
- [ ] place-bid-api-test.png
- [ ] get-products-api-test.png
- [ ] user-balance-api-test.png

### Unit Testing
- [ ] bidding-unit-test-results.png
- [ ] user-unit-test-results.png
- [ ] product-unit-test-results.png

### Integration Testing
- [ ] register-login-integration-test.png
- [ ] product-bidding-integration-test.png
- [ ] complete-auction-flow-test.png

### Mobile Testing
- [ ] mobile-ios-expo-test.png
- [ ] mobile-android-expo-test.png
- [ ] mobile-login-screen.png
- [ ] mobile-google-auth.png
- [ ] mobile-logged-in-home.png
- [ ] mobile-phone-entry.png
- [ ] mobile-code-verify.png
- [ ] mobile-add-product-form.png
- [ ] mobile-image-upload.png
- [ ] mobile-category-select.png
- [ ] mobile-product-added-success.png
- [ ] mobile-product-detail.png
- [ ] mobile-bid-entry.png
- [ ] mobile-bid-confirm.png
- [ ] mobile-price-updated.png
- [ ] mobile-search-screen.png
- [ ] mobile-search-results.png
- [ ] mobile-filters-applied.png
- [ ] mobile-profile-screen.png
- [ ] mobile-edit-profile.png
- [ ] mobile-profile-updated.png
- [ ] mobile-before-bid.png
- [ ] mobile-after-bid-update.png
- [ ] mobile-english-ui.png
- [ ] mobile-mongolian-ui.png
- [ ] mobile-network-error.png
- [ ] mobile-network-recovered.png

### Web Testing
- [ ] web-home-desktop.png
- [ ] web-home-tablet.png
- [ ] web-home-mobile.png
- [ ] web-product-grid.png
- [ ] web-product-details.png
- [ ] web-bid-history.png
- [ ] web-admin-dashboard.png
- [ ] web-admin-users.png
- [ ] web-admin-products.png
- [ ] web-admin-categories.png
- [ ] web-rich-text-editor.png
- [ ] web-formatted-description.png

### Performance & Security
- [ ] web-performance-timing.png
- [ ] api-response-times.png
- [ ] security-no-token-test.png
- [ ] security-invalid-token-test.png
- [ ] security-password-hashed.png
- [ ] form-validation-errors.png
- [ ] cross-platform-parity.png

---

## NOTES:
- All screenshots should be clear and readable
- Use high resolution (at least 1280px width for desktop)
- Crop screenshots to show relevant content
- Add annotations if needed using image editor
- Name files exactly as specified for easy reference in thesis
