// Translation system for mobile app
// To use: import { t } from '@/src/i18n/translations'
// Then use: t('keyName')

export type Language = 'EN' | 'MN';

let currentLanguage: Language = 'MN'; // Default language

export const setLanguage = (lang: Language) => {
  currentLanguage = lang;
};

export const getLanguage = (): Language => {
  return currentLanguage;
};

export const toggleLanguage = () => {
  currentLanguage = currentLanguage === 'EN' ? 'MN' : 'EN';
};

// Translation dictionary
const translations = {
  EN: {
    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    submit: 'Submit',
    back: 'Back',
    next: 'Next',
    search: 'Search',
    filter: 'Filter',
    clear: 'Clear',
    apply: 'Apply',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',

    // Navigation
    home: 'Home',
    search: 'Search',
    notifications: 'Notifications',
    categories: 'Categories',
    profile: 'Profile',
    selling: 'Selling',

    // Auth
    login: 'Login',
    signup: 'Sign Up',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    phone: 'Phone',
    name: 'Name',
    forgotPassword: 'Forgot Password?',
    rememberMe: 'Remember me',
    noAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
    loginNow: 'Login',
    signupNow: 'Sign Up',
    emailOrPhone: 'Email or Phone',
    phoneNumber: 'Phone Number',

    // Home
    featured: 'Featured',
    trending: 'Trending',
    newArrivals: 'New Arrivals',
    endingSoon: 'Ending Soon',
    recommendedForYou: 'Recommended for you',
    viewAll: 'View All',
    noProducts: 'No products available',

    // Product
    title: 'Title',
    description: 'Description',
    price: 'Price',
    currentBid: 'Current Bid',
    startingBid: 'Starting Bid',
    bidNow: 'Bid Now',
    buyNow: 'Buy Now',
    placeBid: 'Place Bid',
    timeLeft: 'Time Left',
    ended: 'Ended',
    seller: 'Seller',
    condition: 'Condition',
    category: 'Category',
    brand: 'Brand',
    location: 'Location',
    shippingOrigin: 'Shipping Origin',
    bidHistory: 'Bid History',
    noBids: 'No bids yet',
    bidPlaced: 'Bid placed successfully',

    // Add Product
    addProduct: 'Add Product',
    editProduct: 'Edit Product',
    productTitle: 'Product Title',
    productDescription: 'Product Description',
    selectCategory: 'Select Category',
    uploadImages: 'Upload Images',
    selectImages: 'Select Images',
    imageLimit: 'You can upload up to 20 images (5MB each)',
    publish: 'Publish',
    saveDraft: 'Save Draft',
    sellType: 'Sell Type',
    auction: 'Auction',
    fixedPrice: 'Fixed Price',
    startMode: 'Start Mode',
    immediate: 'Start Immediately',
    scheduled: 'Schedule Start',
    duration: 'Duration',
    days: 'days',

    // Profile
    myProfile: 'My Profile',
    myProducts: 'My Products',
    myBids: 'My Bids',
    myWatchlist: 'Watchlist',
    drafts: 'Drafts',
    settings: 'Settings',
    balance: 'Balance',
    addFunds: 'Add Funds',
    transactionHistory: 'Transaction History',
    noBalance: 'No balance',
    noDrafts: 'No drafts saved',
    noWatchlist: 'No items in watchlist',

    // Filters
    sortBy: 'Sort by',
    newest: 'Newest',
    oldest: 'Oldest',
    priceLow: 'Price: Low to High',
    priceHigh: 'Price: High to Low',
    priceRange: 'Price Range',
    min: 'Min',
    max: 'Max',
    allCategories: 'All Categories',
    allBrands: 'All Brands',
    applyFilters: 'Apply Filters',
    clearFilters: 'Clear Filters',

    // Notifications
    newBid: 'New bid on your item',
    outbid: "You've been outbid",
    wonAuction: 'You won the auction!',
    sold: 'Your item has been sold',
    priceDrop: 'Price drop on watched item',
    markAllRead: 'Mark all as read',
    noNotifications: 'No notifications',

    // Errors
    required: 'This field is required',
    invalidEmail: 'Invalid email address',
    invalidPhone: 'Invalid phone number',
    passwordTooShort: 'Password must be at least 6 characters',
    passwordMismatch: 'Passwords do not match',
    loginFailed: 'Login failed',
    networkError: 'Network error occurred',
    uploadFailed: 'Failed to upload images',
    bidTooLow: 'Bid amount is too low',
    insufficientBalance: 'Insufficient balance',

    // Success
    loginSuccess: 'Login successful',
    productAdded: 'Product added successfully',
    productUpdated: 'Product updated successfully',
    draftSaved: 'Draft saved',
    balanceAdded: 'Balance added successfully',

    // Time
    daysShort: 'd',
    hoursShort: 'h',
    minutesShort: 'm',
    secondsShort: 's',
    justNow: 'Just now',
    minutesAgo: '{{count}}m ago',
    hoursAgo: '{{count}}h ago',
    daysAgo: '{{count}}d ago',

    // Selling
    myListings: 'My Listings',
    activeListings: 'Active',
    soldListings: 'Sold',
    draftListings: 'Drafts',
    noActiveListings: 'No active listings',
    noSoldListings: 'No sold items',

    // Identity Verification
    verification: 'Verification',
    verifyIdentity: 'Verify Identity',
    uploadID: 'Upload ID Card',
    takePhoto: 'Take Photo',
    selectFromGallery: 'Select from Gallery',
    verificationPending: 'Verification Pending',
    verificationApproved: 'Verified',
    verificationRejected: 'Verification Failed',

    // Settings
    appearance: 'Appearance',
    darkMode: 'Dark Mode',
    language: 'Language',
    deleteAccount: 'Delete Account',
    deleteAccountConfirm: 'Are you sure you want to delete your account?',
  },
  MN: {
    // TRANSLATE ALL ENGLISH VALUES TO MONGOLIAN HERE
    // Example:
    loading: 'Ачааллаж байна...',
    error: 'Алдаа',
    success: 'Амжилттай',
    cancel: 'Болих',
    confirm: 'Баталгаажуулах',
    save: 'Хадгалах',
    delete: 'Устгах',
    edit: 'Засах',
    close: 'Хаах',
    submit: 'Илгээх',
    back: 'Буцах',
    next: 'Дараах',
    search: 'Хайх',
    filter: 'Шүүлтүүр',
    clear: 'Цэвэрлэх',
    apply: 'Хэрэглэх',
    yes: 'Тийм',
    no: 'Үгүй',
    ok: 'OK',

    // Navigation
    home: 'Нүүр',
    notifications: 'Мэдэгдэл',
    categories: 'Ангилал',
    profile: 'Профайл',
    selling: 'Зарах',

    // CONTINUE TRANSLATING THE REST...
    // Copy all the English keys above and translate them to Mongolian
    // Keep the same key names, only change the values
  },
};

// Translation function with fallback
export const t = (key: string): string => {
  const translation = translations[currentLanguage]?.[key as keyof typeof translations.EN];
  if (translation) {
    return translation;
  }
  // Fallback to English if Mongolian translation not found
  return translations.EN[key as keyof typeof translations.EN] || key;
};

// Translation function with variables
export const tv = (key: string, vars: Record<string, string | number>): string => {
  let text = t(key);
  Object.keys(vars).forEach((varKey) => {
    text = text.replace(`{{${varKey}}}`, String(vars[varKey]));
  });
  return text;
};

export default { t, tv, setLanguage, getLanguage, toggleLanguage };
