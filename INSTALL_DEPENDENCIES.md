# Install Dependencies Guide

## Backend Dependencies

### 1. Navigate to backend directory
```bash
cd backend
```

### 2. Install New Packages

Run this single command to install all new dependencies at once:

```bash
npm install firebase-admin helmet express-mongo-sanitize express-validator express-rate-limit
```

### Package Breakdown:

- **firebase-admin** (^12.0.0): Firebase Admin SDK for push notifications
- **helmet** (^8.0.0): Security headers middleware
- **express-mongo-sanitize** (^2.2.0): Prevent NoSQL injection
- **express-validator** (^7.2.0): Request validation (already in package.json)
- **express-rate-limit** (^7.4.1): Rate limiting middleware

### 3. Optional: Redis for Production Rate Limiting

For production environments with high traffic:

```bash
npm install redis rate-limit-redis
```

## Verify Installation

Check that all packages are installed:

```bash
npm list firebase-admin helmet express-mongo-sanitize express-validator express-rate-limit
```

Expected output (versions may vary):
```
backend@1.0.0 C:\...\backend
├── express-mongo-sanitize@2.2.0
├── express-rate-limit@7.4.1
├── express-validator@7.2.0
├── firebase-admin@12.6.0
└── helmet@8.0.0
```

## package.json Reference

Your `package.json` should include these in the `dependencies` section:

```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cloudinary": "^2.5.1",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "express-async-handler": "^1.2.0",
    "express-mongo-sanitize": "^2.2.0",
    "express-rate-limit": "^7.4.1",
    "express-validator": "^7.2.1",
    "firebase-admin": "^12.6.0",
    "helmet": "^8.0.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.10.0",
    "multer": "^1.4.5-lts.1",
    "node-cron": "^4.2.1",
    "nodemailer": "^6.10.0",
    "socket.io": "^4.8.1"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "nodemon": "^3.1.9"
  }
}
```

## Common Installation Issues

### Issue 1: Firebase Admin Install Fails
**Error**: `npm ERR! code ERESOLVE`

**Solution**:
```bash
npm install firebase-admin --legacy-peer-deps
```

### Issue 2: Python Not Found (Windows)
**Error**: `gyp ERR! find Python`

**Solution**: Some packages need build tools. Install them:
```bash
npm install --global windows-build-tools
```

Or use:
```bash
npm install firebase-admin --ignore-scripts
```

### Issue 3: Permission Denied (Linux/Mac)
**Error**: `EACCES: permission denied`

**Solution**:
```bash
sudo npm install firebase-admin helmet express-mongo-sanitize express-validator express-rate-limit
```

Or fix npm permissions:
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

## Testing the Installation

### 1. Check Node Modules
```bash
ls node_modules | grep -E "firebase|helmet|sanitize|validator|rate"
```

Should show:
```
express-mongo-sanitize
express-rate-limit
express-validator
firebase-admin
helmet
```

### 2. Test Server Start
```bash
npm run dev
```

Expected console output should include:
```
Firebase Admin SDK initialized successfully
Server running on port 5000
```

If you see warnings about missing Firebase credentials, that's OK for now - the app will work without push notifications.

## Next Steps

After installing dependencies:

1. Copy `.env.example` to `.env`
2. Configure required environment variables
3. Start the server with `npm run dev`
4. Check `BACKEND_SETUP.md` for detailed configuration

## Quick Install Script

Create a file called `install.sh` (Linux/Mac) or `install.bat` (Windows):

### Linux/Mac: install.sh
```bash
#!/bin/bash
cd backend
npm install
npm install firebase-admin helmet express-mongo-sanitize express-validator express-rate-limit
cp .env.example .env
echo "✅ Dependencies installed! Edit backend/.env with your credentials"
```

Run with: `chmod +x install.sh && ./install.sh`

### Windows: install.bat
```batch
@echo off
cd backend
npm install
npm install firebase-admin helmet express-mongo-sanitize express-validator express-rate-limit
copy .env.example .env
echo ✅ Dependencies installed! Edit backend\.env with your credentials
pause
```

Run with: `install.bat`

## Package Sizes (Approximate)

- firebase-admin: ~15 MB
- helmet: ~100 KB
- express-mongo-sanitize: ~20 KB
- express-validator: ~500 KB
- express-rate-limit: ~50 KB

**Total additional size**: ~16 MB

## Troubleshooting npm

### Clear npm cache
```bash
npm cache clean --force
```

### Delete node_modules and reinstall
```bash
rm -rf node_modules package-lock.json  # Linux/Mac
# or
rmdir /s node_modules && del package-lock.json  # Windows

npm install
```

### Use yarn instead
```bash
yarn add firebase-admin helmet express-mongo-sanitize express-validator express-rate-limit
```
