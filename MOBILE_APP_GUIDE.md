# 📱 Mobile App User Guide

## ✅ What Was Added to Mobile App

### 1. Phone Authentication Screen
**Location**: `mobile/auctionapp/app/(hidden)/phone-auth.tsx`

**Features**:
- Enter 8-digit phone number
- Receive OTP code (logged to console in dev mode)
- Enter 6-digit verification code
- New users: enter name to complete registration
- Existing users: login directly after OTP verification

**How to Access**:
1. Open mobile app
2. Go to Login screen
3. Click **"Утасны дугаараар нэвтрэх"** (Login with phone number)

### 2. Updated Login Screen
**Location**: `mobile/auctionapp/app/(hidden)/login.tsx`

**New Features Added**:
- ✅ Phone auth button
- ✅ Google auth button (UI ready, backend works)
- ✅ Divider between email and social login

**Authentication Options**:
1. Email + Password (existing)
2. Phone Number + OTP (NEW)
3. Google OAuth (button added)

---

## 🔑 Test Accounts

### Admin Account
```
Email: admin@auction.mn
Password: admin123
Phone: 99001122
Balance: 1,000,000₮
Role: Admin
Trust Score: 100
```

### Test Users

**Buyer 1 (High Trust Score)**
```
Email: buyer1@test.mn
Password: test123
Phone: 88001122
Balance: 500,000₮
Trust Score: 85
Can place deposits: ✅ Yes
```

**Buyer 2 (Medium Trust Score)**
```
Email: buyer2@test.mn
Password: test123
Phone: 77001122
Balance: 300,000₮
Trust Score: 65
Can place deposits: ❌ No (needs 70+)
```

**Seller 1 (High Trust Score)**
```
Email: seller1@test.mn
Password: test123
Phone: 95001122
Balance: 750,000₮
Trust Score: 92
Can place deposits: ✅ Yes
```

**New User (Fresh Account)**
```
Email: newuser@test.mn
Password: test123
Phone: 94001122
Balance: 0₮
Trust Score: 0
Can place deposits: ❌ No
```

---

## 🚀 How to Test Phone Authentication

### Using Mobile App (Expo Go):

1. **Start the mobile app**:
   ```bash
   cd mobile/auctionapp
   npm start
   ```

2. **Open in Expo Go** on your phone

3. **Login Screen**:
   - You'll see 3 buttons:
     - "Нэвтрэх" (Email login)
     - "Утасны дугаараар нэвтрэх" (Phone login) ← NEW
     - "Google-ээр нэвтрэх" (Google login) ← NEW

4. **Click Phone Login Button**

5. **Enter Phone Number**:
   - Try: `99001122` (Admin)
   - Or: `88001122` (Buyer 1)
   - Click "Үргэлжлүүлэх" (Continue)

6. **Check Backend Console**:
   - You'll see: `[DEV MODE] OTP for 99001122: 123456`
   - This is your verification code

7. **Enter OTP Code**:
   - Type the 6-digit code (e.g., `123456`)
   - Click "Баталгаажуулах" (Verify)

8. **Login Success!**:
   - If user exists → redirects to home
   - If new user → asks for name → creates account

---

## 📂 Mobile App File Structure

```
mobile/auctionapp/app/
├── (hidden)/
│   ├── login.tsx ← UPDATED (added phone & Google buttons)
│   ├── phone-auth.tsx ← NEW (phone authentication flow)
│   ├── register.tsx (existing)
│   ├── settings.tsx (existing)
│   └── categories.tsx (existing)
├── (tabs)/
│   ├── index.tsx (home)
│   ├── search.tsx
│   ├── notifications.tsx
│   ├── selling.tsx
│   └── profile.tsx
├── product/
│   └── [id].tsx (product details)
└── _layout.tsx (root layout)
```

---

## 🎯 Where to Find Each Feature

### Phone Authentication
- **Screen**: `app/(hidden)/phone-auth.tsx`
- **API Endpoint**: `POST /api/auth/send-otp`
- **Access**: Login screen → "Утасны дугаараар нэвтрэх" button

### Google Authentication
- **Button Location**: Login screen (below phone auth button)
- **Status**: Button added, backend ready
- **Note**: Full OAuth flow needs Google API setup

### Email Authentication
- **Screen**: `app/(hidden)/login.tsx`
- **API Endpoint**: `POST /api/users/login`
- **Access**: Default login method

### Registration
- **Screen**: `app/(hidden)/register.tsx`
- **Access**: Login screen → "Бүртгүүлэх" link

---

## 🧪 Testing Scenarios

### Scenario 1: Login with Phone (Existing User)
1. Click "Утасны дугаараар нэвтрэх"
2. Enter: `99001122`
3. Check console for OTP
4. Enter OTP code
5. ✅ Should login as Admin

### Scenario 2: Register with Phone (New User)
1. Click "Утасны дугаараар нэвтрэх"
2. Enter any 8-digit number not in database (e.g., `12345678`)
3. Check console for OTP
4. Enter OTP code
5. Enter your name
6. ✅ Should create new account

### Scenario 3: Login with Email
1. Use default login form
2. Email: `admin@auction.mn`
3. Password: `admin123`
4. ✅ Should login as Admin

### Scenario 4: Test Different Trust Scores
- Login as `buyer1@test.mn` → Can place deposits (score 85)
- Login as `buyer2@test.mn` → Cannot place deposits (score 65)

---

## 🔧 Configuration

### Backend (.env)
```env
# Phone Auth
SMS_PROVIDER=unitel
SMS_USERNAME=your-username
SMS_PASSWORD=your-password

# In development, OTP is logged to console
# No SMS gateway needed for testing
```

### Mobile App
- No configuration needed
- Phone auth works automatically
- OTP appears in backend console during development

---

## ❓ FAQ

### Q: Where is the OTP code?
**A**: Check the backend console/terminal. In development mode, OTP codes are logged like this:
```
[DEV MODE] OTP for 99001122: 123456
```

### Q: Can I test without a real phone number?
**A**: Yes! Use the test phone numbers:
- 99001122 (Admin)
- 88001122, 77001122, 95001122 (Test users)

### Q: Why can't I see Google login working?
**A**: The button is there and backend is ready, but you need to:
1. Set up Google OAuth credentials
2. Configure OAuth callback URLs
3. Add Google sign-in to Expo app

### Q: How do I access admin panel?
**A**:
1. Login as admin (admin@auction.mn / admin123)
2. Web: http://localhost:5173 → Admin Dashboard
3. Mobile: Currently only web has full admin dashboard

### Q: Where is the deposit feature?
**A**: Backend is ready (`POST /api/deposits`), but mobile UI needs to be added. Users with 70+ trust score can place deposits.

---

## 📊 Quick Reference

| Feature | Status | Location |
|---------|--------|----------|
| Phone Auth Screen | ✅ Complete | `app/(hidden)/phone-auth.tsx` |
| Phone Auth Button | ✅ Added | `app/(hidden)/login.tsx` |
| Google Auth Button | ✅ UI Only | `app/(hidden)/login.tsx` |
| Email Login | ✅ Working | `app/(hidden)/login.tsx` |
| Test Users | ✅ Created | Database |
| Admin Account | ✅ Created | admin@auction.mn |
| OTP in Console | ✅ Working | Backend logs |

---

## 🎉 Next Steps

Want to add more features?
1. **Notifications Screen**: Update `app/(tabs)/notifications.tsx` to show real notifications
2. **Liked Products**: Create screen to display liked products
3. **Profile Settings**: Add phone number display and editing
4. **EULA Screen**: Show terms acceptance on first login
5. **Google OAuth**: Complete OAuth flow setup

---

## 🆘 Troubleshooting

### Issue: Can't see phone auth button
- Make sure you're on the login screen
- Check if login.tsx was updated correctly
- Restart Expo dev server

### Issue: OTP not appearing
- Check backend console (not mobile app)
- Make sure backend is running on port 5000
- Look for `[DEV MODE] OTP for...` message

### Issue: "Cannot read property 'push'"
- Make sure you're using Expo Router
- Check that all navigation uses `router.push()` not `navigation.navigate()`

---

**Your mobile app now has phone authentication! 🎊**

Try it out by clicking the "Утасны дугаараар нэвтрэх" button on the login screen!
