# Translation Guide - BidNomad Auction App

Your app already has a translation system in place! Here's how to translate everything to Mongolian.

## Web Frontend Translation

### File Location
`frontend/src/context/LanguageContext.jsx`

### How It Works
The app uses a `LanguageContext` with two languages: `MN` (Mongolian) and `EN` (English).
All text is stored in the `translations` object with this structure:

```javascript
const translations = {
  MN: {
    keyName: 'Mongolian text here',
  },
  EN: {
    keyName: 'English text here',
  }
}
```

### What You Need To Do

Open `frontend/src/context/LanguageContext.jsx` and translate the English (`EN`) values to Mongolian in the `MN` section.

## Missing Translations (Add These)

Here are the English strings currently used in your app that need Mongolian translations. Add them to the `MN` section of `LanguageContext.jsx`:

### Common UI Elements
```javascript
MN: {
  // Add these to your existing MN translations:

  // Buttons & Actions
  cancel: 'Cancel',
  confirm: 'Confirm',
  save: 'Save',
  edit: 'Edit',
  update: 'Update',
  close: 'Close',
  submit: 'Submit',
  back: 'Back',
  next: 'Next',
  apply: 'Apply',
  yes: 'Yes',
  no: 'No',
  ok: 'OK',
  showMore: 'Show more',
  showLess: 'Show less',

  // Header
  sell: 'Sell',
  myWatchlist: 'My Watchlist',
  myBids: 'My Bids',
  sellingDashboard: 'Selling Dashboard',
  transactionHistory: 'Transaction History',
  addBalance: 'Add Balance',
  settings: 'Settings',
  myProducts: 'My Products',
  drafts: 'Drafts',

  // Home Page
  recommendedForYou: 'Recommended for you',
  popularNow: 'Popular now',
  newArrivals: 'New arrivals',
  details: 'Details',
  bidNow: 'Bid Now',
  start: 'Start',
  inStock: 'In stock',
  ended: 'Ended',
  left: 'left',
  noDeadline: 'No deadline',
  noProducts: 'No products found for this category.',

  // Product Details
  uploadImages: 'Upload Images',
  dragDropImages: 'Drag and drop images here, or click to select',
  imageLimit: 'You can upload up to 20 images (5MB max each)',
  saveDraft: 'Save Draft',
  publish: 'Publish',
  height: 'Height',
  length: 'Length',
  width: 'Width',
  weight: 'Weight',
  manufacturer: 'Manufacturer',
  model: 'Model',
  year: 'Year',
  mileage: 'Mileage',
  engineSize: 'Engine Size',
  fuelType: 'Fuel Type',
  transmission: 'Transmission',
  color: 'Color',
  bidHistory: 'Bid History',
  bidDeadline: 'Bid Deadline',
  timeLeft: 'Time left',
  placeBid: 'Place Bid',
  buyNow: 'Buy Now',
  addToWatchlist: 'Add to Watchlist',
  removeFromWatchlist: 'Remove from Watchlist',
  shippingOrigin: 'Shipping Origin',
  location: 'Location',
  postedOn: 'Posted on',
  views: 'views',
  bids: 'bids',
  noBids: 'No bids yet',
  enterBidAmount: 'Enter bid amount',
  minimumBid: 'Minimum bid',
  yourBid: 'Your bid',

  // Selling
  sellType: 'Sell Type',
  auction: 'Auction',
  fixedPrice: 'Fixed Price',
  startMode: 'Start Mode',
  immediate: 'Start Immediately',
  scheduled: 'Schedule Start',
  scheduledDate: 'Scheduled Date',
  scheduledTime: 'Scheduled Time',
  duration: 'Duration',
  bidThreshold: 'Bid Threshold',

  // Filters & Sorting
  sortBy: 'Sort by',
  newest: 'Newest',
  oldest: 'Oldest',
  priceLowToHigh: 'Price: Low to High',
  priceHighToLow: 'Price: High to Low',
  endingSoon: 'Ending Soon',
  filterBy: 'Filter by',
  clearFilters: 'Clear Filters',
  applyFilters: 'Apply Filters',
  results: 'results',

  // Authentication
  emailOrPhone: 'Email / Phone number',
  phone: 'Phone',
  rememberMe: 'Remember me',
  noAccount: "Don't have an account?",
  haveAccount: 'Already have an account?',
  signUpNow: 'Sign Up',
  loginNow: 'Login',
  signingIn: 'Signing in...',
  signingUp: 'Signing up...',
  sendingCode: 'Sending verification code...',
  verifying: 'Verifying...',
  emailVerification: 'Email Verification',
  verify: 'Verify',
  verificationCodeSent: 'Verification code sent to',
  checkSpam: 'Note: Email not received? Please check your Spam folder. Code expires in 10 minutes.',
  acceptTerms: 'I accept the Terms of Service and EULA.',
  phoneNumberPlaceholder: '99123456',
  phoneHelp: '8-digit phone number (example: 99123456)',
  googleSignIn: 'Sign in with Google',
  googleSignUp: 'Sign up with Google',
  createAccount: 'Create Account',

  // Profile
  noProducts: 'You haven't listed any products yet',
  noBids: 'You haven't placed any bids yet',
  noWatchlist: 'Your watchlist is empty',
  noDrafts: 'No drafts saved',
  noTransactions: 'No transaction history',
  amount: 'Amount',
  recharge: 'Recharge',
  transactionDate: 'Date',
  transactionType: 'Type',
  transactionAmount: 'Amount',
  transactionStatus: 'Status',
  deleteAccount: 'Delete Account',
  deleteAccountConfirm: 'Are you sure you want to permanently delete your account? This action cannot be undone.',
  accountDeleted: 'Account deleted successfully',
  language: 'Language',
  profilePicture: 'Profile Picture',
  updateProfile: 'Update Profile',
  changePassword: 'Change Password',
  oldPassword: 'Old Password',
  newPassword: 'New Password',
  confirmNewPassword: 'Confirm New Password',

  // Drafts
  draftSaved: 'Draft saved',
  draftDeleted: 'Draft deleted',
  autoSaving: 'Auto-saving...',
  lastSaved: 'Last saved',
  resumeDraft: 'Resume',
  deleteDraft: 'Delete',
  loadDraft: 'Load Draft',
  savingDraft: 'Saving draft...',
  draftAutoSaved: 'Draft auto-saved',

  // Notifications
  newBid: 'New bid on your item',
  outbid: 'You've been outbid',
  wonAuction: 'You won the auction',
  sold: 'Your item has been sold',
  priceDrop: 'Price drop on watched item',
  expiringSoon: 'Item expiring soon',
  likeUpdate: 'Someone liked your item',
  justNow: 'Just now',

  // Error Messages
  required: 'This field is required',
  invalidEmail: 'Please enter a valid email',
  invalidPhone: 'Please enter a valid 8-digit phone number',
  passwordTooShort: 'Password must be at least 6 characters',
  passwordsDoNotMatch: 'Passwords do not match',
  loginFailed: 'Invalid email/phone or password',
  registerFailed: 'Registration failed',
  verificationFailed: 'Invalid verification code',
  networkError: 'Network error. Please try again.',
  unknownError: 'An error occurred. Please try again.',
  uploadFailed: 'Failed to upload images',
  imageTooLarge: 'Image is too large (max 5MB)',
  tooManyImages: 'You can only upload up to 20 images',
  bidTooLow: 'Bid amount is too low',
  insufficientBalance: 'Insufficient balance',
  auctionEnded: 'This auction has ended',
  notLoggedIn: 'Please login to continue',

  // Success Messages
  loginSuccess: 'Login successful',
  registerSuccess: 'Registration successful',
  verificationSent: 'Verification code sent',
  productAdded: 'Product added successfully',
  productUpdated: 'Product updated successfully',
  productDeleted: 'Product deleted successfully',
  bidPlaced: 'Bid placed successfully',
  addedToWatchlist: 'Added to watchlist',
  removedFromWatchlist: 'Removed from watchlist',
  balanceAdded: 'Balance added successfully',
  profileUpdated: 'Profile updated successfully',

  // Footer
  aboutUs: 'About Us',
  contactUs: 'Contact Us',
  termsOfService: 'Terms of Service',
  privacyPolicy: 'Privacy Policy',
  faq: 'FAQ',
  help: 'Help',
  followUs: 'Follow Us',
  allRightsReserved: 'All rights reserved',
}
```

## Mobile App Translation

I'll create a similar translation system for your mobile app.

### File to Create
`mobile/auctionapp/src/i18n/translations.ts`

### What You Need To Do
1. I'll create the translation file structure
2. You translate the English values to Mongolian
3. Import and use the `t()` function in your components

---

## Quick Translation Tips

1. **Keep it consistent**: Use the same Mongolian word for the same English concept throughout
2. **Keep it short**: Especially for buttons and labels
3. **Test on real devices**: Make sure Mongolian text displays correctly
4. **Use proper Mongolian grammar**: Adjust word order as needed for Mongolian

## Example Translation Pattern

```javascript
// English
EN: {
  login: 'Login',
  loginSuccess: 'Login successful',
  loggingIn: 'Logging in...',
}

// Mongolian
MN: {
  login: 'Нэвтрэх',
  loginSuccess: 'Амжилттай нэвтэрлээ',
  loggingIn: 'Нэвтэрч байна...',
}
```

---

## Need Help?

If you need help with any specific translation or have questions about the system, just ask!
