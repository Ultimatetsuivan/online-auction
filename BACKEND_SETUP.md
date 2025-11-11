# Backend Setup Instructions

## Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

## Installation Steps

### 1. Install Dependencies

First, install the required npm packages:

```bash
cd backend
npm install
```

### 2. Install New Dependencies

Install the new dependencies for the upgraded features:

```bash
npm install firebase-admin helmet express-mongo-sanitize express-validator express-rate-limit
```

Optional (for Redis-based rate limiting in production):
```bash
npm install redis rate-limit-redis
```

### 3. Environment Configuration

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Then edit `.env` and configure the following:

#### Required Configuration:
- `MONGO_URI`: Your MongoDB connection string
- `JWT_SECRET`: A strong random secret for JWT tokens
- `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET`: Cloudinary credentials
- `EMAIL_USER`, `EMAIL_PASS`: Gmail SMTP credentials

#### Phone Authentication (Required):
- `SMS_PROVIDER`: Choose `unitel`, `mobicom`, or `skytel`
- `SMS_USERNAME`, `SMS_PASSWORD`: Your SMS gateway credentials

**Note**: For development/testing, phone auth will work in dev mode and log OTP codes to console.

#### Firebase Push Notifications (Recommended):
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing
3. Go to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. Add the credentials to `.env`:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` (make sure to keep the `\n` newlines)

**Note**: If Firebase credentials are not provided, push notifications will be skipped (app will still work).

#### QPay Webhook (Optional):
- `QPAY_WEBHOOK_SECRET`: Generate a random secret key
- Configure this webhook URL in your QPay merchant dashboard:
  ```
  https://yourdomain.com/api/webhook/qpay-webhook
  ```

### 4. Database Migration

The new models will be created automatically when you start the server. No manual migration needed for MongoDB.

### 5. Start the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server should start on `http://localhost:5000`

## New API Endpoints

### Phone Authentication
- `POST /api/auth/send-otp` - Send OTP to phone
- `POST /api/auth/verify-otp` - Verify OTP and login
- `POST /api/auth/register-phone` - Register with phone
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/fcm-token` - Register FCM token
- `DELETE /api/auth/fcm-token/:token` - Remove FCM token

### Likes
- `POST /api/likes/:productId` - Toggle like
- `GET /api/likes/my` - Get my liked products
- `GET /api/likes/:productId/check` - Check if liked
- `GET /api/likes/:productId/count` - Get like count

### Notifications
- `GET /api/notifications` - Get notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `POST /api/notifications/mark-all-read` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

### Deposits
- `POST /api/deposits` - Place deposit
- `GET /api/deposits/my` - Get my deposits
- `GET /api/deposits/all` (admin) - Get all deposits

### Legal/EULA
- `GET /api/legal/eula/current` - Get current EULA
- `POST /api/legal/eula/accept` - Accept EULA
- `GET /api/legal/eula/status` - Check acceptance status
- `POST /api/legal/document` (admin) - Create legal document

### Admin Analytics
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/sales-chart` - Sales chart data
- `GET /api/admin/recent-users` - Recently joined users
- `GET /api/admin/top-sellers` - Top sellers
- `GET /api/admin/category-stats` - Category statistics
- `GET /api/admin/user-activity` - User activity chart

### Payment Webhook
- `POST /api/webhook/qpay-webhook` - QPay payment webhook (called by QPay)
- `GET /api/webhook/verify/:invoiceId` (admin) - Manual payment verification

## Testing the Setup

### 1. Health Check
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-02-01T10:00:00.000Z",
  "uptime": 123.456
}
```

### 2. Send OTP (Phone Auth)
```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "99001122"}'
```

In development mode, check console for OTP code.

### 3. Test Firebase (if configured)
Check server logs on startup. You should see:
```
Firebase Admin SDK initialized successfully
```

## Troubleshooting

### Phone Auth Not Working
- Check SMS provider credentials in `.env`
- In development, OTP will be logged to console
- Verify phone number format (8 digits, no country code)

### Push Notifications Not Working
- Verify Firebase credentials are correct
- Check that `FIREBASE_PRIVATE_KEY` includes `\n` characters
- Ensure mobile app has registered FCM token

### QPay Webhook Not Receiving Calls
- Ensure webhook URL is publicly accessible (not localhost)
- Use ngrok for local testing: `ngrok http 5000`
- Configure ngrok URL in QPay dashboard

### Rate Limiting Too Strict
- Adjust limits in `backend/middleware/rateLimiter.js`
- For development, you can disable rate limiting temporarily

## Production Deployment

### Additional Steps for Production:

1. **Set NODE_ENV**:
   ```
   NODE_ENV=production
   ```

2. **Use Strong JWT Secret**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

3. **Enable Redis for Rate Limiting**:
   - Install Redis
   - Uncomment Redis configuration in `rateLimiter.js`
   - Add Redis connection to `.env`

4. **HTTPS Only**:
   - Use reverse proxy (nginx) with SSL certificate
   - Cookies will be secure automatically

5. **Configure QPay Webhook**:
   - Add production URL to QPay dashboard
   - Set `QPAY_WEBHOOK_SECRET` to secure random string

6. **Monitor Logs**:
   - Use PM2 or similar for process management
   - Set up log aggregation (Winston, Loggly, etc.)

## Security Checklist

- ✅ JWT tokens expire after 15 minutes
- ✅ Refresh tokens expire after 7 days
- ✅ Rate limiting on all API endpoints
- ✅ Input validation and sanitization
- ✅ MongoDB injection prevention
- ✅ Helmet security headers
- ✅ CORS configured for specific origins
- ✅ HTTP-only cookies for refresh tokens
- ✅ QPay webhook signature verification
- ✅ Password hashing with bcrypt

## Need Help?

Check the main README.md for more information or raise an issue on the repository.
