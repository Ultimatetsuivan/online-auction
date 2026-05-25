# DATABASE ENTITY RELATIONSHIP DIAGRAM (ERD)
## Online Auction System - MongoDB Database

---

## TABLE OF CONTENTS
1. [ERD Overview](#erd-overview)
2. [Text-Based ERD](#text-based-erd)
3. [Entities & Attributes](#entities--attributes)
4. [Relationships](#relationships)
5. [How to Create Visual ERD](#how-to-create-visual-erd)

---

## ERD OVERVIEW

Your database consists of **11 main collections** in MongoDB:

1. **User** - User accounts and authentication
2. **Product** - Auction products/items
3. **Bidding** - Bid history and tracking
4. **Category** - Product categories (hierarchical)
5. **Watchlist** - User's watched products
6. **Review** - User reviews and ratings
7. **Transaction** - Completed transactions
8. **Notification** - User notifications
9. **Report** - Product/user reports
10. **Like** - Liked products (additional)
11. **NotificationSettings** - User notification preferences

---

## TEXT-BASED ERD

```
┌──────────────────────────────────────────────────────────────────────┐
│                        USER (Central Entity)                          │
├──────────────────────────────────────────────────────────────────────┤
│ PK: _id (ObjectId)                                                   │
│ • username (String, unique)                                          │
│ • name (String, required)                                            │
│ • surname (String)                                                   │
│ • registrationNumber (String, unique)                                │
│ • email (String, required, indexed)                                  │
│ • password (String, hashed, required)                                │
│ • photo { filePath, public_id }                                      │
│ • phone (String, unique, indexed)                                    │
│ • phoneVerified (Boolean)                                            │
│ • role (String: admin/buyer)                                         │
│ • googleId (String, unique, indexed)                                 │
│ • eMongoliaId (String, unique)                                       │
│ • eMongoliaVerified (Boolean)                                        │
│ • balance (Number, default: 0)                                       │
│ • fcmTokens [String] - Push notification tokens                     │
│ • trustScore (Number, 0-100)                                         │
│ • completedDeals (Number)                                            │
│ • cancelledBids (Number)                                             │
│ • identityVerified (Boolean)                                         │
│ • identityVerification { status, documents, idDetails }             │
│ • resetPasswordToken (String)                                        │
│ • resetPasswordExpires (Date)                                        │
│ • timestamps                                                         │
└──────────────────────────────────────────────────────────────────────┘
         │
         │ 1:N (seller)
         ├─────────────────────────────────────────┐
         │                                         │
         ▼                                         │
┌──────────────────────────────────────────────────────────────────────┐
│                            PRODUCT                                    │
├──────────────────────────────────────────────────────────────────────┤
│ PK: _id (ObjectId)                                                   │
│ FK: user (ObjectId → User) - Seller                                  │
│ FK: category (ObjectId → Category)                                   │
│ FK: highestBidder (ObjectId → User)                                  │
│ FK: soldTo (ObjectId → User)                                         │
│ • title (String, required, indexed)                                  │
│ • slug (String, unique)                                              │
│ • description (String, rich text)                                    │
│ • images [{ url, publicId, isPrimary }] - Max 20                    │
│ • price (Number, starting price)                                     │
│ • currentBid (Number)                                                │
│ • reservePrice (Number)                                              │
│ • buyNowPrice (Number)                                               │
│ • minIncrement (Number)                                              │
│ • bidThreshold (Number)                                              │
│ • condition (String: new/used/refurbished/like-new)                  │
│ • brand, color, size (String)                                        │
│ • dimensions: height, length, width, weight                          │
│ • Vehicle fields: vin, make, model, year, mileage, fuelType, etc.   │
│ • itemSpecifics (Map<String, String>)                               │
│ • sellerDescription (String)                                         │
│ • startMode (String: immediate/scheduled)                            │
│ • auctionStart (Date)                                                │
│ • auctionDuration (Number, days)                                     │
│ • bidDeadline (Date)                                                 │
│ • auctionStatus (String: scheduled/active/ended)                     │
│ • verified (Boolean)                                                 │
│ • verification { status, photos, reviewedBy, badgeType }            │
│ • sold (Boolean)                                                     │
│ • available (Boolean)                                                │
│ • views (Number)                                                     │
│ • uniqueViewers [ObjectId → User]                                    │
│ • timestamps                                                         │
└──────────────────────────────────────────────────────────────────────┘
         │
         │ 1:N
         ├─────────┬─────────┬─────────┬─────────┬─────────┐
         │         │         │         │         │         │
         ▼         ▼         ▼         ▼         ▼         ▼
    ┌─────────┐ ┌──────┐ ┌─────────┐ ┌──────┐ ┌──────┐ ┌──────┐
    │ BIDDING │ │WATCH-│ │ REVIEW  │ │TRANS-│ │NOTIF.│ │REPORT│
    │         │ │ LIST │ │         │ │ACTION│ │      │ │      │
    └─────────┘ └──────┘ └─────────┘ └──────┘ └──────┘ └──────┘

┌──────────────────────────────────────────────────────────────────────┐
│                            BIDDING                                    │
├──────────────────────────────────────────────────────────────────────┤
│ PK: _id (ObjectId)                                                   │
│ FK: user (ObjectId → User) - Bidder                                  │
│ FK: product (ObjectId → Product)                                     │
│ • price (Number, required)                                           │
│ • timestamps (createdAt, updatedAt)                                  │
│                                                                      │
│ Indexes:                                                             │
│ • { product: 1, price: -1, createdAt: -1 }                          │
│ • { user: 1, product: 1, createdAt: -1 }                            │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                          CATEGORY                                     │
├──────────────────────────────────────────────────────────────────────┤
│ PK: _id (ObjectId)                                                   │
│ FK: user (ObjectId → User, optional)                                 │
│ FK: parent (ObjectId → Category, self-reference)                     │
│ • title (String, required)                                           │
│ • titleMn (String) - Mongolian name                                  │
│ • slug (String, unique)                                              │
│ • description (String)                                               │
│ • icon (String) - Ionicons name                                      │
│ • image (String) - Image URL                                         │
│ • order (Number) - Display order                                     │
│ • isActive (Boolean)                                                 │
│ • productCount (Number)                                              │
│ • timestamps                                                         │
│                                                                      │
│ Self-Referencing: parent → Category (hierarchical)                  │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                          WATCHLIST                                    │
├──────────────────────────────────────────────────────────────────────┤
│ PK: _id (ObjectId)                                                   │
│ FK: user (ObjectId → User)                                           │
│ FK: product (ObjectId → Product)                                     │
│ • notifyOnStart (Boolean, default: true)                            │
│ • notifyOnEndingSoon (Boolean, default: true)                       │
│ • notifyOnPriceChange (Boolean, default: true)                      │
│ • createdAt (Date)                                                   │
│                                                                      │
│ Unique Index: { user: 1, product: 1 }                               │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                            REVIEW                                     │
├──────────────────────────────────────────────────────────────────────┤
│ PK: _id (ObjectId)                                                   │
│ FK: product (ObjectId → Product)                                     │
│ FK: toUser (ObjectId → User) - Reviewed user                         │
│ FK: fromUser (ObjectId → User) - Reviewer                            │
│ • rating (Number, 1-5, required)                                     │
│ • comment (String, trim)                                             │
│ • timestamps                                                         │
│                                                                      │
│ Unique Index: { product: 1, fromUser: 1 }                           │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                        TRANSACTION                                    │
├──────────────────────────────────────────────────────────────────────┤
│ PK: _id (ObjectId)                                                   │
│ FK: buyer (ObjectId → User)                                          │
│ FK: seller (ObjectId → User)                                         │
│ FK: product (ObjectId → Product)                                     │
│ • amount (Number, required, min: 0)                                  │
│ • createdAt (Date)                                                   │
│ • timestamps                                                         │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                        NOTIFICATION                                   │
├──────────────────────────────────────────────────────────────────────┤
│ PK: _id (ObjectId)                                                   │
│ FK: user (ObjectId → User)                                           │
│ FK: product (ObjectId → Product, optional)                           │
│ • type (String, enum)                                                │
│   - like_update, outbid, won_auction, sold, price_drop,            │
│     expiring_soon, new_bid                                           │
│ • title (String, required)                                           │
│ • message (String, required)                                         │
│ • read (Boolean, default: false)                                     │
│ • actionUrl (String)                                                 │
│ • metadata (Mixed)                                                   │
│ • createdAt (Date)                                                   │
│                                                                      │
│ Indexes:                                                             │
│ • { user: 1, createdAt: -1 }                                        │
│ • { user: 1, read: 1 }                                              │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                            REPORT                                     │
├──────────────────────────────────────────────────────────────────────┤
│ PK: _id (ObjectId)                                                   │
│ FK: product (ObjectId → Product, optional)                           │
│ FK: user (ObjectId → User, optional) - Reported user                 │
│ FK: reporter (ObjectId → User, required)                             │
│ FK: resolvedBy (ObjectId → User, optional)                           │
│ • type (String, required)                                            │
│ • description (String, required)                                     │
│ • status (String: pending/resolved)                                  │
│ • resolutionNote (String)                                            │
│ • resolvedAt (Date)                                                  │
│ • timestamps                                                         │
│                                                                      │
│ Index: { status: 1, createdAt: -1 }                                 │
└──────────────────────────────────────────────────────────────────────┘
```

---

## ENTITIES & ATTRIBUTES

### 1. USER Collection

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `_id` | ObjectId | PK | Unique user ID |
| `username` | String | Unique, Sparse | Username |
| `name` | String | Required | Full name |
| `surname` | String | | Surname |
| `registrationNumber` | String | Unique, Sparse | Mongolian ID (УГ########) |
| `email` | String | Required, Indexed | Email address |
| `password` | String | Required, Hashed | Bcrypt hashed password |
| `photo` | Object | | { filePath, public_id } |
| `phone` | String | Unique, Sparse | 8-digit phone |
| `phoneVerified` | Boolean | Default: false | Phone verification status |
| `role` | String | Enum: admin/buyer | User role |
| `googleId` | String | Unique, Sparse, Indexed | Google OAuth ID |
| `eMongoliaId` | String | Unique, Sparse | eMongolia ID |
| `eMongoliaVerified` | Boolean | Default: false | eMongolia verification |
| `balance` | Number | Default: 0 | User wallet balance |
| `fcmTokens` | Array[String] | | Push notification tokens |
| `trustScore` | Number | 0-100 | Trust/reputation score |
| `completedDeals` | Number | Default: 0 | Successful transactions |
| `cancelledBids` | Number | Default: 0 | Cancelled bid count |
| `identityVerified` | Boolean | Default: false | KYC verification status |
| `identityVerification` | Object | | KYC documents and status |
| `resetPasswordToken` | String | | Password reset token |
| `resetPasswordExpires` | Date | | Token expiry |
| `createdAt` | Date | Auto | Creation timestamp |
| `updatedAt` | Date | Auto | Update timestamp |

**Indexes:**
- `{ email: 1 }`
- `{ phone: 1 }` (unique, sparse)
- `{ googleId: 1 }` (unique, sparse)
- `{ eMongoliaId: 1 }` (unique, sparse)
- `{ username: 1 }` (unique, sparse)
- `{ role: 1, trustScore: -1 }` (compound)

---

### 2. PRODUCT Collection

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `_id` | ObjectId | PK | Unique product ID |
| `user` | ObjectId | FK → User, Required | Seller/owner |
| `category` | ObjectId | FK → Category | Product category |
| `highestBidder` | ObjectId | FK → User | Current highest bidder |
| `soldTo` | ObjectId | FK → User | Buyer (when sold) |
| `title` | String | Required, Indexed | Product title |
| `slug` | String | Unique | URL-friendly slug |
| `description` | String | | Rich text description |
| `images` | Array | Max 20 | [{ url, publicId, isPrimary }] |
| `price` | Number | Required | Starting price |
| `currentBid` | Number | Default: 0 | Current highest bid |
| `reservePrice` | Number | | Minimum acceptable price |
| `buyNowPrice` | Number | | Instant purchase price |
| `minIncrement` | Number | Default: 1 | Minimum bid increment |
| `bidThreshold` | Number | | Auto-sell threshold |
| `condition` | String | Enum | new/used/refurbished/like-new |
| `brand` | String | | Brand name |
| `color` | String | | Color |
| `size` | String | | Size |
| `dimensions` | Object | | height, length, width, weight |
| `vin` | String | Unique, Sparse | Vehicle VIN |
| `make` | String | | Vehicle make |
| `model` | String | | Vehicle model |
| `year` | Number | 1900-2100 | Vehicle year |
| `mileage` | Number | Min: 0 | Vehicle mileage |
| `fuelType` | String | Enum | gasoline/diesel/electric/hybrid |
| `transmission` | String | Enum | automatic/manual/cvt |
| `vehicleTitle` | String | Enum | clean/salvage/rebuilt |
| `vehicleHistoryReport` | Object | | History report details |
| `itemSpecifics` | Map | | Key-value pairs |
| `sellerDescription` | String | | Seller's description |
| `startMode` | String | Enum, Required | immediate/scheduled |
| `auctionStart` | Date | Required | Auction start time |
| `auctionDuration` | Number | Required, Default: 7 | Duration in days |
| `bidDeadline` | Date | Required | Auction end time |
| `auctionStatus` | String | Enum | scheduled/active/ended |
| `verified` | Boolean | Default: false | Product verified |
| `verification` | Object | | Verification details |
| `sold` | Boolean | Default: false | Product sold status |
| `available` | Boolean | Default: true | Available for bidding |
| `views` | Number | Default: 0 | View count |
| `uniqueViewers` | Array[ObjectId] | | Unique viewer IDs |
| `createdAt` | Date | Auto | Creation timestamp |
| `updatedAt` | Date | Auto | Update timestamp |

**Indexes:**
- `{ available: 1, sold: 1, auctionStatus: 1, createdAt: -1 }` (compound)
- `{ category: 1, auctionStatus: 1, available: 1 }` (compound)
- `{ user: 1, auctionStatus: 1 }` (compound)
- `{ highestBidder: 1, auctionStatus: 1 }` (compound)
- `{ auctionStatus: 1, auctionStart: 1 }` (compound)
- `{ auctionStatus: 1, bidDeadline: 1 }` (compound)
- `{ title: 'text', description: 'text' }` (text index)
- `{ slug: 1 }` (unique)

---

### 3. BIDDING Collection

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `_id` | ObjectId | PK | Unique bid ID |
| `user` | ObjectId | FK → User, Required | Bidder |
| `product` | ObjectId | FK → Product, Required | Product being bid on |
| `price` | Number | Required | Bid amount |
| `createdAt` | Date | Auto | Bid timestamp |
| `updatedAt` | Date | Auto | Update timestamp |

**Indexes:**
- `{ product: 1, price: -1, createdAt: -1 }` (compound)
- `{ user: 1, product: 1, createdAt: -1 }` (compound)
- `{ user: 1, createdAt: -1 }` (compound)
- `{ product: 1, createdAt: -1 }` (compound)

---

### 4. CATEGORY Collection

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `_id` | ObjectId | PK | Unique category ID |
| `user` | ObjectId | FK → User, Optional | Creator |
| `parent` | ObjectId | FK → Category | Parent category (self-ref) |
| `title` | String | Required | Category name (English) |
| `titleMn` | String | | Category name (Mongolian) |
| `slug` | String | Unique | URL-friendly slug |
| `description` | String | | Category description |
| `icon` | String | Default: cube-outline | Ionicons icon name |
| `image` | String | | Image URL |
| `order` | Number | Default: 0 | Display order |
| `isActive` | Boolean | Default: true | Active status |
| `productCount` | Number | Default: 0 | Products in category |
| `createdAt` | Date | Auto | Creation timestamp |
| `updatedAt` | Date | Auto | Update timestamp |

**Relationships:**
- Self-referencing: `parent` → Category (hierarchical structure)

---

### 5. WATCHLIST Collection

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `_id` | ObjectId | PK | Unique watchlist ID |
| `user` | ObjectId | FK → User, Required | User watching |
| `product` | ObjectId | FK → Product, Required | Watched product |
| `notifyOnStart` | Boolean | Default: true | Notify when auction starts |
| `notifyOnEndingSoon` | Boolean | Default: true | Notify when ending soon |
| `notifyOnPriceChange` | Boolean | Default: true | Notify on price change |
| `createdAt` | Date | Auto | Added to watchlist timestamp |

**Indexes:**
- `{ user: 1, product: 1 }` (unique compound)
- `{ user: 1, createdAt: -1 }` (compound)
- `{ product: 1 }`

---

### 6. REVIEW Collection

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `_id` | ObjectId | PK | Unique review ID |
| `product` | ObjectId | FK → Product, Required | Reviewed product |
| `toUser` | ObjectId | FK → User, Required | User being reviewed |
| `fromUser` | ObjectId | FK → User, Required | Reviewer |
| `rating` | Number | Required, 1-5 | Star rating |
| `comment` | String | Trim | Review text |
| `createdAt` | Date | Auto | Review timestamp |
| `updatedAt` | Date | Auto | Update timestamp |

**Indexes:**
- `{ product: 1, fromUser: 1 }` (unique compound)
- `{ toUser: 1, createdAt: -1 }` (compound)

---

### 7. TRANSACTION Collection

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `_id` | ObjectId | PK | Unique transaction ID |
| `buyer` | ObjectId | FK → User, Required | Buyer |
| `seller` | ObjectId | FK → User, Required | Seller |
| `product` | ObjectId | FK → Product, Required | Product sold |
| `amount` | Number | Required, Min: 0 | Transaction amount |
| `createdAt` | Date | Auto | Transaction timestamp |
| `updatedAt` | Date | Auto | Update timestamp |

---

### 8. NOTIFICATION Collection

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `_id` | ObjectId | PK | Unique notification ID |
| `user` | ObjectId | FK → User, Required | Recipient user |
| `product` | ObjectId | FK → Product, Optional | Related product |
| `type` | String | Enum, Required | Notification type |
| `title` | String | Required | Notification title |
| `message` | String | Required | Notification message |
| `read` | Boolean | Default: false | Read status |
| `actionUrl` | String | | Action URL |
| `metadata` | Mixed | | Additional data |
| `createdAt` | Date | Auto | Notification timestamp |

**Type Enum:**
- `like_update`
- `outbid`
- `won_auction`
- `sold`
- `price_drop`
- `expiring_soon`
- `new_bid`

**Indexes:**
- `{ user: 1, createdAt: -1 }` (compound)
- `{ user: 1, read: 1 }` (compound)

---

### 9. REPORT Collection

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `_id` | ObjectId | PK | Unique report ID |
| `product` | ObjectId | FK → Product, Optional | Reported product |
| `user` | ObjectId | FK → User, Optional | Reported user |
| `reporter` | ObjectId | FK → User, Required | User reporting |
| `resolvedBy` | ObjectId | FK → User, Optional | Admin who resolved |
| `type` | String | Required | Report type |
| `description` | String | Required | Report description |
| `status` | String | Enum | pending/resolved |
| `resolutionNote` | String | | Admin's resolution note |
| `resolvedAt` | Date | | Resolution timestamp |
| `createdAt` | Date | Auto | Report timestamp |
| `updatedAt` | Date | Auto | Update timestamp |

**Index:**
- `{ status: 1, createdAt: -1 }` (compound)

---

## RELATIONSHIPS

### One-to-Many (1:N)

1. **User → Product** (as seller)
   - One user can sell many products
   - `User._id` ← `Product.user`

2. **User → Bidding** (as bidder)
   - One user can place many bids
   - `User._id` ← `Bidding.user`

3. **Product → Bidding**
   - One product can have many bids
   - `Product._id` ← `Bidding.product`

4. **User → Watchlist**
   - One user can watch many products
   - `User._id` ← `Watchlist.user`

5. **Product → Watchlist**
   - One product can be watched by many users
   - `Product._id` ← `Watchlist.product`

6. **User → Review** (as reviewer)
   - One user can write many reviews
   - `User._id` ← `Review.fromUser`

7. **User → Review** (as reviewed)
   - One user can receive many reviews
   - `User._id` ← `Review.toUser`

8. **Product → Review**
   - One product can have many reviews
   - `Product._id` ← `Review.product`

9. **User → Transaction** (as buyer)
   - One user can have many purchase transactions
   - `User._id` ← `Transaction.buyer`

10. **User → Transaction** (as seller)
    - One user can have many sale transactions
    - `User._id` ← `Transaction.seller`

11. **User → Notification**
    - One user can have many notifications
    - `User._id` ← `Notification.user`

12. **Product → Notification**
    - One product can generate many notifications
    - `Product._id` ← `Notification.product`

13. **User → Report** (as reporter)
    - One user can file many reports
    - `User._id` ← `Report.reporter`

14. **Product → Report**
    - One product can be reported many times
    - `Product._id` ← `Report.product`

15. **Category → Product**
    - One category can have many products
    - `Category._id` ← `Product.category`

### Self-Referencing

1. **Category → Category** (parent-child)
   - One category can have many subcategories
   - `Category._id` ← `Category.parent`
   - Creates hierarchical category tree

### Many-to-Many (M:N) - Implemented via Junction Tables

1. **User ↔ Product** (via Watchlist)
   - Many users can watch many products
   - Junction: `Watchlist { user, product }`

2. **User ↔ Product** (via Bidding)
   - Many users can bid on many products
   - Junction: `Bidding { user, product }`

### Special Relationships

1. **Product.highestBidder → User**
   - Current highest bidder reference
   - Updated dynamically with each bid

2. **Product.soldTo → User**
   - Winner/buyer reference
   - Set when auction ends

3. **Product.uniqueViewers → [User]**
   - Array of users who viewed product
   - For analytics

---

## HOW TO CREATE VISUAL ERD

### Using draw.io (Recommended - FREE)

**Step 1: Open draw.io**
- Go to https://app.diagrams.net/
- Create new diagram → Choose "Entity Relation" template

**Step 2: Create Entities**

For each collection (User, Product, Bidding, etc.):

1. Drag "Entity" shape onto canvas
2. Double-click to name it (e.g., "USER")
3. Add attributes by clicking "+" icon or right-clicking

**Entity Format:**
```
┌──────────────────────┐
│    USER              │
├──────────────────────┤
│ PK _id: ObjectId     │
│ • email: String      │
│ • password: String   │
│ • name: String       │
│ • phone: String      │
│ • role: String       │
│ • balance: Number    │
│ • trustScore: Number │
│ • timestamps         │
└──────────────────────┘
```

**Step 3: Add Relationships**

Use **Crow's Foot Notation**:
- `1` (one) - Single line
- `N` (many) - Crow's foot (three lines)

**Example: User → Product (1:N)**
```
USER ─────<  PRODUCT
  1         N
```

Draw line from User to Product:
- Click "Relation" connector
- Draw from User._id to Product.user
- Label: "sells" or "1:N"

**Step 4: Color Coding** (Optional)

- **Primary entities**: Blue (#3B82F6)
- **Junction tables**: Green (#10B981)
- **Reference entities**: Yellow (#F59E0B)

**Step 5: Layout**

Suggested layout:
```
                    USER (center)
                      │
         ┌────────────┼────────────┬─────────┐
         │            │            │         │
         ▼            ▼            ▼         ▼
     PRODUCT      BIDDING     WATCHLIST  REVIEW
         │            │
         ▼            ▼
     CATEGORY    TRANSACTION
```

### Using Lucidchart (Professional)

1. Sign up at https://www.lucidchart.com/
2. Create new → "Entity Relationship Diagram"
3. Choose "Crow's Foot" notation
4. Drag entities and add attributes
5. Connect with relationships

### Using MySQL Workbench (Alternative)

1. Open MySQL Workbench
2. Create EER Diagram
3. Add tables (even though you're using MongoDB)
4. Add columns as attributes
5. Draw relationships
6. Export as PNG

---

## QUICK REFERENCE DIAGRAM

```
┌─────────┐ 1:N  ┌──────────┐ 1:N  ┌─────────┐
│  USER   │─────<│ PRODUCT  │─────<│ BIDDING │
└─────────┘      └──────────┘      └─────────┘
     │ 1:N            │ N:1             │ N:1
     │                └───────────┐     │
     │ 1:N                        ▼     │
     └────────────────────>  ┌──────────┴───┐
                             │  CATEGORY    │
     ┌─────────┐            └──────────────┘
     │  USER   │                  │
     └─────────┘                  │ self-ref
          │ 1:N                   │ (parent)
          ▼                       ▼
     ┌──────────┐           ┌──────────┐
     │WATCHLIST │           │CATEGORY  │
     └──────────┘           └──────────┘
          │ N:1
          └──────> PRODUCT

     ┌─────────┐ 1:N  ┌──────────┐
     │  USER   │─────<│  REVIEW  │
     └─────────┘      └──────────┘
          │ 1:N            │ N:1
          │                └───────> PRODUCT
          ▼
     ┌──────────────┐
     │ TRANSACTION  │
     └──────────────┘
          │ N:1
          └───────> PRODUCT

     ┌─────────┐ 1:N  ┌──────────────┐
     │  USER   │─────<│ NOTIFICATION │
     └─────────┘      └──────────────┘
                            │ N:1
                            └───────> PRODUCT

     ┌─────────┐ 1:N  ┌──────────┐
     │  USER   │─────<│  REPORT  │
     └─────────┘      └──────────┘
                            │ N:1
                            └───────> PRODUCT
```

---

## CARDINALITY SUMMARY

| Relationship | Type | Description |
|--------------|------|-------------|
| User → Product (seller) | 1:N | One user can sell many products |
| User → Bidding | 1:N | One user can place many bids |
| Product → Bidding | 1:N | One product can have many bids |
| User → Watchlist | 1:N | One user can watch many products |
| Product → Watchlist | 1:N | One product watched by many users |
| User → Review (reviewer) | 1:N | One user writes many reviews |
| User → Review (reviewed) | 1:N | One user receives many reviews |
| Product → Review | 1:N | One product has many reviews |
| User → Transaction (buyer) | 1:N | One user makes many purchases |
| User → Transaction (seller) | 1:N | One user makes many sales |
| Product → Transaction | 1:1 | One product = one transaction (when sold) |
| Category → Product | 1:N | One category has many products |
| Category → Category | 1:N | Parent-child hierarchy |
| User → Notification | 1:N | One user has many notifications |
| Product → Notification | 1:N | One product generates many notifications |
| User → Report | 1:N | One user files many reports |
| Product → Report | 1:N | One product has many reports |

---

## INDEXES SUMMARY

### Performance Indexes

**User:**
- `{ email: 1 }` - Fast login
- `{ phone: 1 }` - Phone auth
- `{ googleId: 1 }` - OAuth
- `{ username: 1 }` - Profile lookup
- `{ role: 1, trustScore: -1 }` - Admin queries

**Product:**
- `{ available: 1, sold: 1, auctionStatus: 1, createdAt: -1 }` - Home page
- `{ category: 1, auctionStatus: 1, available: 1 }` - Category browsing
- `{ user: 1, auctionStatus: 1 }` - My auctions
- `{ title: 'text', description: 'text' }` - Search
- `{ slug: 1 }` - Product detail

**Bidding:**
- `{ product: 1, price: -1, createdAt: -1 }` - Highest bid
- `{ user: 1, product: 1, createdAt: -1 }` - User bid history
- `{ user: 1, createdAt: -1 }` - All user bids

**Watchlist:**
- `{ user: 1, product: 1 }` - Unique constraint
- `{ user: 1, createdAt: -1 }` - User's watchlist

**Notification:**
- `{ user: 1, createdAt: -1 }` - User notifications
- `{ user: 1, read: 1 }` - Unread notifications

---

## NOTES FOR THESIS

### Key Points to Highlight:

1. **NoSQL Design**: MongoDB schema-less design with embedded documents (e.g., `photo`, `verification`, `itemSpecifics`)

2. **Indexes for Performance**: Strategic indexes on frequently queried fields and compound indexes for complex queries

3. **Referential Integrity**: Using ObjectId references (`ref: "User"`) for relationships, similar to foreign keys in SQL

4. **Embedded vs Referenced**:
   - **Embedded**: photo, verification data, images array
   - **Referenced**: user, product, category (for normalization)

5. **Hierarchical Data**: Category collection with self-referencing parent-child relationship

6. **Bidirectional Relationships**: User ↔ Product through multiple paths (seller, bidder, watcher, reviewer)

7. **Specialized Fields**: Vehicle-specific fields, identity verification, trust scoring

8. **Timestamps**: Automatic `createdAt` and `updatedAt` in most collections

9. **Unique Constraints**: Compound unique indexes (e.g., `{ user: 1, product: 1 }` in Watchlist)

10. **Text Search**: Full-text search on product title and description

---

**Created for:** Online Auction System Thesis
**Database:** MongoDB (NoSQL)
**Total Collections:** 11
**Total Relationships:** 17+
**Indexes:** 30+

---

**Use this document to:**
1. Create visual ERD in draw.io
2. Reference in your thesis Chapter 2
3. Explain database design decisions
4. Show normalization strategy
5. Demonstrate understanding of NoSQL design
