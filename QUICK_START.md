# 🚀 QUICK START GUIDE

## ✅ Everything Is Fixed and Working!

The password issue is resolved. You can now login!

---

## 🔑 Login Credentials (WORKING NOW!)

### Admin Account
```
Email: admin@auction.mn
Password: admin123
Phone: 99001122
```

### Test Users
```
buyer1@test.mn / test123 (Phone: 88001122)
buyer2@test.mn / test123 (Phone: 77001122)
seller1@test.mn / test123 (Phone: 95001122)
newuser@test.mn / test123 (Phone: 94001122)
```

---

## 🌐 URLs

- **Frontend (Web)**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

---

## 📱 HOW TO LOGIN (3 Methods)

### Method 1: Email Login (WEB)

1. Open: http://localhost:5173
2. Click "Login" or "Admin"
3. Enter:
   - Email: `admin@auction.mn`
   - Password: `admin123`
4. Click "Нэвтрэх" (Login)
5. ✅ You're in!

### Method 2: Email Login (MOBILE)

1. Open mobile app (Expo Go)
2. You'll see login screen
3. Enter:
   - Email: `admin@auction.mn`
   - Password: `admin123`
4. Click "Нэвтрэх" (Login)
5. ✅ Redirects to home!

### Method 3: Phone Login (MOBILE) ⭐ NEW

1. Open mobile app
2. On login screen, click:
   **"Утасны дугаараар нэвтрэх"**
   (Login with phone number)

3. Enter phone: `99001122`

4. Click "Үргэлжлүүлэх" (Continue)

5. **LOOK AT YOUR TERMINAL/CONSOLE** where backend is running
   You'll see something like:
   ```
   [DEV MODE] OTP for 99001122: 123456
   ```

6. Type the 6-digit code (e.g., `123456`)

7. Click "Баталгаажуулах" (Verify)

8. ✅ Login successful!

---

## 📋 WHERE TO FIND OTP CODE

### ⚠️ IMPORTANT: OTP appears in BACKEND CONSOLE, not mobile app!

**Look here** ↓

1. Open the terminal/console where you ran `npm start` in the **backend** folder

2. Look for this line:
   ```
   [DEV MODE] OTP for 99001122: 427951
                                 ^^^^^^
                                 This is your code!
   ```

3. The 6-digit number after "OTP for" is your verification code

4. Type this code in the mobile app

### Example:
```
Backend console shows:
[DEV MODE] OTP for 88001122: 847362

You type in mobile: 8 4 7 3 6 2
```

---

## 🧪 Test Scenarios

### Scenario 1: Login as Admin (Web)
1. Go to http://localhost:5173
2. Email: `admin@auction.mn`, Password: `admin123`
3. Access admin dashboard
4. See stats, users, categories

### Scenario 2: Login with Phone (Mobile)
1. Click "Утасны дугаараар нэвтрэх"
2. Phone: `99001122`
3. Check backend console for OTP
4. Enter OTP code
5. Login success!

### Scenario 3: Test Different Users
- Login as `buyer1@test.mn` → Can place deposits (trust score: 85)
- Login as `buyer2@test.mn` → Cannot place deposits (trust score: 65)
- Login as `seller1@test.mn` → High trust seller (score: 92)

---

## ❓ Troubleshooting

### "Email or password is wrong"
**✅ FIXED!** Run this again:
```bash
cd backend
node scripts/createTestUsers.js
```

### "OTP code is wrong"
- Make sure you're looking at **backend console**, not mobile app
- Look for the LATEST OTP (bottom of console)
- OTP expires after 3 minutes - request new one if expired

### "Cannot find phone auth button"
- Make sure you're on the login screen (not register screen)
- Look for "Утасны дугаараар нэвтрэх" below email login
- Scroll down if you don't see it

### "Google login not working"
- Google button is visible but needs OAuth setup
- Use email or phone login instead for now

---

## 🎯 Quick Commands

### Recreate Test Users
```bash
cd backend
node scripts/createTestUsers.js
```

### Check Backend Logs for OTP
- Just look at the terminal where backend is running
- OTPs will appear like: `[DEV MODE] OTP for 99001122: 123456`

### Test Login with curl
```bash
# Admin login
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@auction.mn","password":"admin123"}'

# Should return user data + token
```

### Send OTP
```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"99001122"}'

# Check backend console for OTP code
```

---

## 📊 What Works Now

✅ Email login (web & mobile)
✅ Phone auth with OTP (mobile)
✅ Admin panel access
✅ User management
✅ Password: admin123 ✅
✅ OTP generation ✅
✅ Google button (UI ready)

---

## 🎉 You're Ready!

1. **Web**: Open http://localhost:5173
2. **Login**: Use `admin@auction.mn` / `admin123`
3. **Mobile**: Use phone auth with `99001122`
4. **OTP**: Look at backend console

**Everything works now!** 🚀

---

## 🆘 Still Having Issues?

1. Make sure backend is running: `cd backend && npm start`
2. Make sure frontend is running: `cd frontend && npm run dev`
3. Recreate users: `node scripts/createTestUsers.js`
4. Check backend console for errors or OTP codes
5. Try email login first before phone auth

---

**Happy Testing! 🎊**
