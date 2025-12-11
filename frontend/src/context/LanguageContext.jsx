import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

// Translation dictionary
const translations = {
  MN: {
    // Navigation
    home: 'Нүүр хуудас',
    auctions: 'Дуудлага худалдаа',
    about: 'Тухай',
    myList: 'Миний жагсаалт',
    myListSubtitle: 'Миний хадгалсан бараанууд',
    profile: 'Миний профайл',
    adminPanel: 'Админ панел',
    login: 'Нэвтрэх',
    signup: 'Бүртгүүлэх',
    logout: 'Гарах',
    
    // Home Page
    recommended: 'Өнөөдрийн танд санал болгож буй бараанууд',
    trendingItems: 'Эрэлттэй бараанууд',
    trendingCategories: 'Эрэлттэй ангилал',
    trendingBrands: 'Тренд брэнд',
    recentlyViewed: 'Сүүлийн үзсэн',
    recommendedProducts: 'Санал болгосон бараа',
    viewAll: 'Бүгдийг харах',
    placeBid: 'Санал тавих',
    currentBid: 'Одоогийн санал:',
    timeLeft: 'Өдөр:',
    items: 'ширхэг',

    // Timer
    days: 'өдөр',
    hours: 'цаг',
    minutes: 'минут',
    seconds: 'секунд',
    auctionEnded: 'Зарагдсан',
    daysShort: 'ө',
    hoursShort: 'ц',
    minutesShort: 'м',
    secondsShort: 'с',
    endsOn: 'Дуусах огноо:',
    auctionEndsOn: 'Дуудлага худалдаа дуусах огноо',

    // Expiring Soon Section
    expiringSoon: 'Дуусах гэж буй зарууд',
    endingIn24Hours: '24 цагт дуусна',
    noExpiringAuctions: 'Одоогоор дуусах гэж буй аукцион байхгүй байна',

    // Notifications
    notifications: 'Мэдэгдэл',
    markAllRead: 'Бүгдийг уншсан',
    new: 'Шинэ',
    viewAllNotifications: 'Бүх мэдэгдлийг үзэх',
    
    // Search
    searchPlaceholder: 'Хайж буй бараагаа зөвхөн эндээс',
      searchButtonLabel: 'Search',
      searchButtonLabel: 'Хайх',
    browseCategories: 'Бүх ангилал үзэх',
    browseBrands: 'Бүх брэнд үзэх',
    recentlySearched: 'Сүүлийн хайлтууд',
    clear: 'Цэвэрлэх',
    
    // Categories
    categories: 'Ангилал',
    allCategories: 'Бүх ангилал',
    noCategoriesFound: 'Ангилал олдсонгүй',
    viewProducts: 'Бараа харах',
    backToCategories: 'Ангилал руу буцах',
    noProductsInCategory: 'Энэ ангилалд бараа олдсонгүй',
    
    // Common
    noItemsFound: 'Бараа олдсонгүй',
    loading: 'Ачааллаж байна...',
    error: 'Алдаа гарлаа',
    
    // My List
    noSavedFilters: 'Хадгалсан шүүлт олдсонгүй. Шүүлтээ хадгалаад шинэ бараа мэдэгдэл авах!',
    notificationsEnabled: 'Мэдэгдэл идэвхжсэн',
    delete: 'Устгах',
    noProductsInFilter: 'Энэ шүүлтэд тохирох бараа олдсонгүй',
    noNewProducts: 'Дагадаг хэрэглэгчдээс шинэ бараа байхгүй байна',
    noFollowing: 'Дагасан хэрэглэгч байхгүй байна',
    following: 'Чиний дуртай борлуулагч',
    savedFilters: 'Хадгалсан шүүлтүүрүүд',
    likedProducts: 'Чиний хадгалсан бараа',
    
    // Filters
    filter: 'Шүүлтүүр',
    category: 'Ангилал',
    allCategories: 'Бүх ангилал',
    brand: 'Брэнд',
    allBrands: 'Бүх брэнд',
    priceRange: 'Үнийн хязгаар',
    minPrice: 'Хамгийн бага',
    maxPrice: 'Хамгийн их',
    condition: 'Байдал',
    all: 'Бүгд',
    new: 'Шинэ',
    likeNew: 'Шинэ дүйтэй',
    used: 'Хэрэглэсэн',
    refurbished: 'Сэргээгдсэн',
    status: 'Төлөв',
    active: 'Идэвхтэй (24ц+)',
    endingSoon: 'Удахгүй дуусах (24ц)',
    endingToday: 'Өнөөдөр дуусна (1ц)',
    sortBy: 'Эрэмбэлэх',
    newlyAdded: 'Шинээр нэмэгдсэн',
    oldest: 'Хуучин',
    priceLow: 'Үнэ өсөхөөр',
    priceHigh: 'Үнэ буурахаар',
    endingSoonSort: 'Дуусах хугацаа',
    clearFilters: 'Бүх шүүлтүүр цэвэрлэх',
    color: 'Өнгө',
    size: 'Хэмжээ',
    seller: 'Борлуулагч',
    verifiedSeller: 'Баталгаажсан',
    allSellers: 'Бүх борлуулагч',
    discount: 'Хөнгөлөлт',
    hasDiscount: 'Хөнгөлөлттэй',
    freeShipping: 'Хүргэлт үнэгүй',
    verifiedProduct: 'Баталгаажсан бараа',

    // Auth Pages
    email: 'Имэйл',
    password: 'Нууц үг',
    confirmPassword: 'Нууц үг баталгаажуулах',
    fullName: 'Бүтэн нэр',
    emailAddress: 'Имэйл хаяг',
    enterEmail: 'Имэйл хаягаа оруулна уу',
    enterPassword: 'Нууц үгээ оруулна уу',
    enterFullName: 'Бүтэн нэрээ оруулна уу',
    confirmPasswordPlaceholder: 'Нууц үгээ давтан оруулна уу',
    alreadyHaveAccount: 'Бүртгэлтэй юу?',
    dontHaveAccount: 'Бүртгэлгүй юу?',
    loginNow: 'Нэвтрэх',
    signupNow: 'Бүртгүүлэх',
    forgotPassword: 'Нууц үг мартсан?',
    resetPassword: 'Нууц үг сэргээх',
    sendVerificationCode: 'Баталгаажуулах код илгээх',
    verifyCode: 'Код шалгах',
    verificationCode: 'Баталгаажуулах код',
    enterVerificationCode: 'Имэйл дээр ирсэн 6 оронтой кодыг оруулна уу',
    resendCode: 'Код дахин илгээх',
    newPassword: 'Шинэ нууц үг',
    enterNewPassword: 'Шинэ нууц үгээ оруулна уу',

    // Profile Page
    myProducts: 'Миний бараанууд',
    addProduct: 'Бараа нэмэх',
    transactionHistory: 'Гүйлгээний түүх',
    addBalance: 'Данс цэнэглэх',
    settings: 'Тохиргоо',
    myInfo: 'Миний мэдээлэл',
    products: 'Бараа',
    balance: 'Үлдэгдэл',
    phoneNumber: 'Утасны дугаар',
    profileStats: 'Хураангуй статистик',
    notProvided: 'Мэдээлэл байхгүй',
    editPhoto: 'Зураг солих',
    uploadPhoto: 'Зураг оруулах',

    // Transaction History
    product: 'Бараа',
    price: 'Үнэ',
    seller: 'Худалдагч',
    date: 'Огноо',
    loading: 'Уншиж байна...',
    noTransactions: 'Гүйлгээний түүх хоосон байна',
    yourTransactions: 'Таны хийсэн гүйлгээ энд харагдана',
    unknownProduct: 'Тодорхойгүй бараа',
    unknownSeller: 'Тодорхойгүй худалдагч',

    // Add Balance
    rechargeAmount: 'Цэнэглэх дүн (₮)',
    minAmount: 'Хамгийн бага дүн: 1,000₮',
    recharging: 'Цэнэглэж байна...',
    rechargeWithQpay: 'QPay-р данс цэнэглэх',
    rechargeSuccess: 'Амжилттай цэнэглэгдлээ! Таны шинэ үлдэгдэл:',
    qpaySystem: 'QPay төлбөрийн систем',
    qpayInstructions: 'Дээрх дүнг оруулаад "QPay-р данс цэнэглэх" товчийг дарна уу',
    scanQrCode: 'QR кодыг уншуулна уу',

    // Settings
    appearance: 'Харагдах байдал',
    darkMode: 'Харанхуй горим',
    darkModeDescription: 'Нүдэнд ээлтэй харанхуй дэлгэц',
    tip: 'Зөвлөмж:',
    darkModeTip: 'Харанхуй горимыг ашиглавал нүд хамгийн бага ядарна.',

    // My Products Section
    search: 'Хайх...',
    loadingProducts: 'Бараануудыг ачаалж байна...',
    errorOccurred: 'Алдаа гарлаа!',
    retry: 'Дахин оролдох',
    sold: 'Зарагдсан',
    notSold: 'Зарагдаагүй',
    details: 'Дэлгэрэнгүй',
    sell: 'Зарах',
    edit: 'Засах',
    delete: 'Устгах',
    noProductsYet: 'Одоогоор бараа байхгүй байна',
    noSearchResults: 'гэсэн үр дүн олдсонгүй',
    confirmSell: 'Та энэ барааг',
    sureToSell: '-р зарахад итгэлтэй байна уу?',
    soldSuccessfully: 'Бараа амжилттай зарагдлаа! Гүйлгээний дугаар:',
    sellError: 'Бараа зарах явцад алдаа гарлаа',
    confirmDelete: 'Та энэ барааг устгахдаа итгэлтэй байна уу?',
    deletedSuccessfully: 'Бараа амжилттай устгагдлаа',
    deleteError: 'Устгахад алдаа гарлаа',
    productName: 'Бүтээгдэхүүний нэр',
    description: 'Тайлбар',
    startingPrice: 'Эхлэх үнэ',
    auctionDuration: 'Аукционы үргэлжлэх хугацаа',
    endTime: 'Дуусах цаг',
    selectCategory: 'Ангилал сонгох',
    selectDuration: 'Хугацаа сонгох',
    selectEndTime: 'Дуусах цаг сонгох',
    days3: '3 хоног',
    days7: '7 хоног',
    days14: '2 долоо хоног',
    morning: 'Өглөө',
    afternoon: 'Орой',
    night: 'Шөнө',
    automotiveInfo: 'Автомашины мэдээлэл',
    manufacturer: 'Үйлдвэрлэгч',
    model: 'Загвар',
    year: 'Жил',
    mileage: 'Гүйлт',
    engineSize: 'Хөдөлгүүрийн багтаамж',
    fuelType: 'Түлшний төрөл',
    transmission: 'Хурдны хайрцаг',
    additionalInfo: 'Нэмэлт мэдээлэл',
    dragOrSelect: 'Зураг чирж оруулах эсвэл сонгох',
    selectImages: 'Зураг сонгох',
    maxImages: '20 зураг хүртэл',
    uploadedImages: 'Оруулсан зурагнууд',
    submit: 'Илгээх',
    submitting: 'Илгээж байна...',
    updateProduct: 'Бараа шинэчлэх',
    noProducts: 'Танд бараа байхгүй байна',
    addFirstProduct: 'Эхний бараагаа нэмээрэй!',
    loginRequired: 'Нэвтрэх шаардлагатай',
    loginToViewProfile: 'Профайл харахын тулд нэвтрэнэ үү',
    cancel: 'Болих',
    save: 'Хадгалах',

    // ===== Yahoo Auctions-Style Start System =====
    // Start Mode
    auctionStartMode: 'Аукцион эхлэх хэлбэр',
    startImmediately: 'Шууд эхлүүлэх',
    scheduleStart: 'Хугацаа товлох',

    // Scheduled Start Fields
    scheduledDate: 'Эхлэх огноо',
    scheduledTime: 'Эхлэх цаг',
    selectScheduledDate: 'Эхлэх огноог сонгох',
    selectScheduledTime: 'Эхлэх цагийг сонгох',

    // Duration
    auctionDurationDays: 'Аукционы үргэлжлэх хугацаа',
    selectDurationDays: 'Үргэлжлэх хугацаа сонгох',
    day1: '1 хоног',
    day3: '3 хоног',
    day5: '5 хоног',
    day7: '7 хоног',
    day10: '10 хоног',
    day14: '14 хоног',

    // Info Messages
    auctionStartsNow: 'Аукцион одоо эхэлж,',
    auctionEndsAfter: 'хоногийн дараа дуусна',
    auctionStartsAt: 'цагт эхлэнэ',
    pleaseSelectDateTime: 'Эхлэх огноо болон цагийг сонгоно уу',

    // Validation Messages
    pleaseSelectDuration: 'Аукционы үргэлжлэх хугацааг сонгоно уу',
    pleaseEnterStartDateTime: 'Эхлэх огноо болон цагийг оруулна уу',
    startDateMustBeFuture: 'Эхлэх огноо ирээдүйд байх ёстой',
    pleaseEnterStartingBid: 'Аукционы эхлэх үнийг оруулна уу',
    pleaseFillAllFields: 'Бүх талбарыг бөглөнө үү',
    pleaseUploadImage: 'Хамгийн багадаа 1 зураг оруулна уу',

    imageLimitWarning: 'You can upload up to 20 images (5MB max each).',

    // Status Labels
    auctionScheduled: 'Товлогдсон',
    auctionActive: 'Идэвхтэй',
    auctionEnded: 'Дууссан',
    notAvailableYet: 'Хараахан эхлээгүй',
    biddingAvailable: 'Үнийн санал өгөх боломжтой',
    biddingClosed: 'Үнийн санал өгөх хаагдсан',

    // Success/Error Messages
    productCreatedSuccess: 'Бараа амжилттай нэмэгдлээ!',
    productUpdatedSuccess: 'Бараа амжилттай шинэчлэгдлээ!',
    productCreationFailed: 'Бараа нэмэхэд алдаа гарлаа',

    // Additional
    immediateStartTooltip: 'Аукцион одоо эхлэнэ',
    scheduledStartTooltip: 'Аукцион тодорхой цагт эхлэнэ',

    // ===== Product Detail Page - eBay Style =====
    // Vehicle History Report
    vehicleHistoryReport: 'Тээврийн хэрэгслийн түүх',
    reportNotAvailable: 'Тайлан байхгүй',
    reportAvailableForPurchase: 'Худалдан авах боломжтой',
    trustedPartner: 'Найдвартай түнш',
    possibleReasonsNotAvailable: 'Тайлан байхгүй шалтгаан:',
    reasonTooOldNoHistory: 'Тээврийн хэрэгсэл хэтэрхий хуучин тул түүх байхгүй',
    reasonManufacturedBefore1981: 'Тээврийн хэрэгсэл 1981 оноос өмнө үйлдвэрлэгдсэн',
    reasonNo17DigitVIN: 'Тээврийн хэрэгсэл 17 оронтой танигчтай биш',
    reasonNotIntendedForUS: 'Тээврийн хэрэгсэл АНУ-ын зах зээлд зориулагдаагүй (хязгаарлагдмал үйлдвэрлэл зэрэг)',
    reasonIncorrectVIN: 'Борлуулагч танигчийн дугаарыг буруу оруулсан',

    // Item Specifics
    itemSpecifics: 'Дэлгэрэнгүй мэдээлэл',
    aboutThisItem: 'Энэ барааны тухай',
    sellerNotes: 'Худалдагчийн тэмдэглэл',
    listed: 'Нийтэлсэн',
    bids: 'Үнийн санал',
    coverage: 'Хамрах хүрээ',
    documentationHandlingFee: 'Баримт бичгийн хураамж',
    forSaleBy: 'Борлуулагч',
    dealer: 'Дилер',
    vehicleTitle: 'Гэрчилгээний төрөл',
    clean: 'Цэвэр',
    salvage: 'Эвдрэлтэй',
    rebuilt: 'Сэргээгдсэн',
    make: 'Брэнд',
    model: 'Загвар',
    vin: 'Танигчийн дугаар (VIN)',
    guaranteeProvided: 'Баталгаа',
    transmission: 'Хурдны хайрцаг',
    automatic: 'Автомат',
    manual: 'Механик',
    cvt: 'CVT',
    fuelType: 'Түлшний төрөл',
    gasoline: 'Бензин',
    diesel: 'Дизель',
    electric: 'Цахилгаан',
    hybrid: 'Хайбрид',
    other: 'Бусад',

    // Item Description from Seller
    itemDescriptionFromSeller: 'Худалдагчийн дэлгэрэнгүй тайлбар',
    sellerInformation: 'Худалдагчийн мэдээлэл',
    contactUs: 'Бидэнтэй холбогдох',
    buyers: 'Худалдан авагчид',
    sellers: 'Худалдагчид',
    viewAllAuctions: 'Бүх дуудлага худалдааг үзэх',
    viewStore: 'Дэлгүүр үзэх',
    sellerFeedback: 'Худалдагчийн үнэлгээ',
    positiveReviews: 'Эерэг үнэлгээ',
    itemsSold: 'Зарагдсан бараа',

    // About This Seller
    aboutThisSeller: 'Худалдагчийн тухай',
    joinedDate: 'Нэгдсэн огноо',
    detailedSellerRatings: 'Дэлгэрэнгүй үнэлгээ',

    // Shipping & Location
    shipping: 'Хүргэлт',
    delivery: 'Хүргэх',
    payments: 'Төлбөр',
    located: 'Байршил',
    seeItemDescription: 'Дэлгэрэнгүй мэдээлэл харах',
    fullPaymentRequired: 'Бүрэн төлбөр шаардлагатай',
    withinDaysOfClose: 'дууссанаас хойш хоногийн дотор',
    varies: 'Харилцан',
  },
  EN: {
    // Navigation
    home: 'Home',
    auctions: 'Auctions',
    about: 'About',
    myList: 'My List',
    myListSubtitle: 'My Saved Products',
    profile: 'My Profile',
    adminPanel: 'Admin Panel',
    login: 'Login',
    signup: 'Sign Up',
    logout: 'Logout',
    
    // Home Page
    recommended: 'Recommended',
    trendingItems: 'Trending Items',
    trendingCategories: 'Trending Categories',
    trendingBrands: 'Trending Brands',
    recentlyViewed: 'Recently Viewed',
    recommendedProducts: 'Recommended Products',
    viewAll: 'View All',
    placeBid: 'Place Bid',
    currentBid: 'Current Bid:',
    timeLeft: 'Time left:',
    items: 'items',

    // Timer
    days: 'days',
    hours: 'hours',
    minutes: 'minutes',
    seconds: 'seconds',
    auctionEnded: 'Auction Ended',
    daysShort: 'd',
    hoursShort: 'h',
    minutesShort: 'm',
    secondsShort: 's',
    endsOn: 'Ends on:',
    auctionEndsOn: 'Auction ends on',

    // Expiring Soon Section
    expiringSoon: 'Expiring Soon',
    endingIn24Hours: 'Ending in 24 hours',
    noExpiringAuctions: 'No auctions expiring soon',

    // Notifications
    notifications: 'Notifications',
    markAllRead: 'Mark all as read',
    new: 'New',
    viewAllNotifications: 'View all notifications',
    
    // Search
    searchPlaceholder: 'Search for anything...',
    browseCategories: 'Browse All Categories',
    browseBrands: 'Browse All Brands',
    recentlySearched: 'Recently Searched',
    clear: 'Clear',
    
    // Categories
    categories: 'Categories',
    allCategories: 'All Categories',
    noCategoriesFound: 'No categories found',
    viewProducts: 'View Products',
    backToCategories: 'Back to Categories',
    noProductsInCategory: 'No products found in this category',
    
    // Common
    noItemsFound: 'No items found',
    loading: 'Loading...',
    error: 'An error occurred',
    
    // My List
    noSavedFilters: 'No saved filters yet. Save your search filters to get notified when new products match!',
    notificationsEnabled: 'Notifications ON',
    delete: 'Delete',
    noProductsInFilter: 'No products found matching this filter.',
    noNewProducts: 'No new products from users you follow yet.',
    
    // Filters
    filter: 'Filter',
    category: 'Category',
    allCategories: 'All Categories',
    brand: 'Brand',
    allBrands: 'All Brands',
    priceRange: 'Price Range',
    minPrice: 'Min',
    maxPrice: 'Max',
    condition: 'Condition',
    all: 'All',
    new: 'New',
    likeNew: 'Like New',
    used: 'Used',
    refurbished: 'Refurbished',
    status: 'Status',
    active: 'Active (24h+)',
    endingSoon: 'Ending Soon (24h)',
    endingToday: 'Ends Today (1h)',
    sortBy: 'Sort By',
    newlyAdded: 'Newly Added',
    oldest: 'Oldest',
    priceLow: 'Price: Low to High',
    priceHigh: 'Price: High to Low',
    endingSoonSort: 'Ending Soon',
    clearFilters: 'Clear All Filters',
    color: 'Color',
    size: 'Size',
    seller: 'Seller',
    verifiedSeller: 'Verified Seller',
    allSellers: 'All Sellers',
    discount: 'Discount',
    hasDiscount: 'With Discount',
    freeShipping: 'Free Shipping',
    verifiedProduct: 'Verified Product',

    // Auth Pages
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    fullName: 'Full Name',
    emailAddress: 'Email Address',
    enterEmail: 'Enter your email',
    enterPassword: 'Enter your password',
    enterFullName: 'Enter your full name',
    confirmPasswordPlaceholder: 'Re-enter your password',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    loginNow: 'Login',
    signupNow: 'Sign Up',
    forgotPassword: 'Forgot Password?',
    resetPassword: 'Reset Password',
    sendVerificationCode: 'Send Verification Code',
    verifyCode: 'Verify Code',
    verificationCode: 'Verification Code',
    enterVerificationCode: 'Enter the 6-digit code sent to your email',
    resendCode: 'Resend Code',
    newPassword: 'New Password',
    enterNewPassword: 'Enter your new password',

    // Profile Page
    myProducts: 'My Products',
    addProduct: 'Add Product',
    transactionHistory: 'Transaction History',
    addBalance: 'Add Balance',
    settings: 'Settings',
    myInfo: 'My Info',
    products: 'Products',
    balance: 'Balance',
    phoneNumber: 'Phone Number',
    profileStats: 'Profile Stats',
    notProvided: 'Not provided',
    editPhoto: 'Edit Photo',
    uploadPhoto: 'Upload Photo',

    // Transaction History
    product: 'Product',
    price: 'Price',
    seller: 'Seller',
    date: 'Date',
    loading: 'Loading...',
    noTransactions: 'No transaction history',
    yourTransactions: 'Your transactions will appear here',
    unknownProduct: 'Unknown Product',
    unknownSeller: 'Unknown Seller',

    // Add Balance
    rechargeAmount: 'Recharge Amount (₮)',
    minAmount: 'Minimum amount: 1,000₮',
    recharging: 'Recharging...',
    rechargeWithQpay: 'Recharge with QPay',
    rechargeSuccess: 'Successfully recharged! Your new balance:',
    qpaySystem: 'QPay Payment System',
    qpayInstructions: 'Enter the amount above and click "Recharge with QPay" button',
    scanQrCode: 'Scan the QR code',

    // Settings
    appearance: 'Appearance',
    darkMode: 'Dark Mode',
    darkModeDescription: 'Eye-friendly dark display',
    tip: 'Tip:',
    darkModeTip: 'Using dark mode reduces eye strain.',

    // My Products Section
    search: 'Search...',
    loadingProducts: 'Loading products...',
    errorOccurred: 'An error occurred!',
    retry: 'Retry',
    sold: 'Sold',
    notSold: 'Not Sold',
    details: 'Details',
    sell: 'Sell',
    edit: 'Edit',
    delete: 'Delete',
    noProductsYet: 'No products yet',
    noSearchResults: 'No results found for',
    confirmSell: 'Are you sure you want to sell this item for',
    sureToSell: '?',
    soldSuccessfully: 'Product sold successfully! Transaction ID:',
    sellError: 'An error occurred while selling the product',
    confirmDelete: 'Are you sure you want to delete this product?',
    deletedSuccessfully: 'Product deleted successfully',
    deleteError: 'Error deleting product',
    productName: 'Product Name',
    description: 'Description',
    startingPrice: 'Starting Price',
    auctionDuration: 'Auction Duration',
    endTime: 'End Time',
    selectCategory: 'Select Category',
    selectDuration: 'Select Duration',
    selectEndTime: 'Select End Time',
    days3: '3 days',
    days7: '7 days',
    days14: '2 weeks',
    morning: 'Morning',
    afternoon: 'Afternoon',
    night: 'Night',
    automotiveInfo: 'Automotive Information',
    manufacturer: 'Manufacturer',
    model: 'Model',
    year: 'Year',
    mileage: 'Mileage',
    engineSize: 'Engine Size',
    fuelType: 'Fuel Type',
    transmission: 'Transmission',
    additionalInfo: 'Additional Information',
    dragOrSelect: 'Drag & drop or select images',
    selectImages: 'Select Images',
    maxImages: 'Up to 20 images',
    uploadedImages: 'Uploaded Images',
    submit: 'Submit',
    submitting: 'Submitting...',
    updateProduct: 'Update Product',
    noProducts: 'You have no products',
    addFirstProduct: 'Add your first product!',
    loginRequired: 'Login Required',
    loginToViewProfile: 'Please login to view your profile',
    cancel: 'Cancel',
    save: 'Save',

    // ===== Yahoo Auctions-Style Start System =====
    // Start Mode
    auctionStartMode: 'Auction Start Mode',
    startImmediately: 'Start Immediately',
    scheduleStart: 'Schedule Start',

    // Scheduled Start Fields
    scheduledDate: 'Start Date',
    scheduledTime: 'Start Time',
    selectScheduledDate: 'Select start date',
    selectScheduledTime: 'Select start time',

    // Duration
    auctionDurationDays: 'Auction Duration',
    selectDurationDays: 'Select duration',
    day1: '1 day',
    day3: '3 days',
    day5: '5 days',
    day7: '7 days',
    day10: '10 days',
    day14: '14 days',

    // Info Messages
    auctionStartsNow: 'Auction starts now and ends in',
    auctionEndsAfter: 'days',
    auctionStartsAt: 'starts at',
    pleaseSelectDateTime: 'Please select start date and time',

    // Validation Messages
    pleaseSelectDuration: 'Please select auction duration',
    pleaseEnterStartDateTime: 'Please enter start date and time',
    startDateMustBeFuture: 'Start date must be in the future',
    pleaseEnterStartingBid: 'Please enter starting bid',
    pleaseFillAllFields: 'Please fill all required fields',
    pleaseUploadImage: 'Please upload at least 1 image',
    imageLimitWarning: 'You can upload up to 20 images (5MB max each).',

    // Status Labels
    auctionScheduled: 'Scheduled',
    auctionActive: 'Active',
    auctionEnded: 'Ended',
    notAvailableYet: 'Not started yet',
    biddingAvailable: 'Bidding available',
    biddingClosed: 'Bidding closed',

    // Success/Error Messages
    productCreatedSuccess: 'Product created successfully!',
    productUpdatedSuccess: 'Product updated successfully!',
    productCreationFailed: 'Failed to create product',

    // Additional
    immediateStartTooltip: 'Auction starts immediately',
    scheduledStartTooltip: 'Auction starts at scheduled time',

    // ===== Product Detail Page - eBay Style =====
    // Vehicle History Report
    vehicleHistoryReport: 'Vehicle History Report',
    reportNotAvailable: 'Report is not available for purchase',
    reportAvailableForPurchase: 'Report is available for purchase',
    trustedPartner: 'Trusted partner',
    possibleReasonsNotAvailable: 'Possible reasons why a report is not available:',
    reasonTooOldNoHistory: 'The vehicle is too old to have a history report',
    reasonManufacturedBefore1981: 'The vehicle was manufactured prior to 1981',
    reasonNo17DigitVIN: "The vehicle didn't have a 17-digit vehicle Identification number",
    reasonNotIntendedForUS: "The vehicle wasn't intended for the US market (such as limited production exotics)",
    reasonIncorrectVIN: "The seller didn't enter the vehicle identification number correctly",

    // Item Specifics
    itemSpecifics: 'Item Specifics',
    aboutThisItem: 'About This Item',
    sellerNotes: 'Seller Notes',
    listed: 'Listed',
    bids: 'Bids',
    coverage: 'Coverage Provided',
    documentationHandlingFee: 'Documentation & Handling Fee',
    forSaleBy: 'For Sale By',
    dealer: 'Dealer',
    vehicleTitle: 'Vehicle Title',
    clean: 'Clean',
    salvage: 'Salvage',
    rebuilt: 'Rebuilt',
    make: 'Make',
    model: 'Model',
    vin: 'VIN (Vehicle Identification Number)',
    guaranteeProvided: '100% Guarantee',
    transmission: 'Transmission',
    automatic: 'Automatic',
    manual: 'Manual',
    cvt: 'CVT',
    fuelType: 'Fuel Type',
    gasoline: 'Gasoline',
    diesel: 'Diesel',
    electric: 'Electric',
    hybrid: 'Hybrid',
    other: 'Other',

    // Item Description from Seller
    itemDescriptionFromSeller: 'Item Description from the Seller',
    sellerInformation: 'Seller Information',
    contactUs: 'Contact Us',
    buyers: 'Buyers',
    sellers: 'Sellers',
    viewAllAuctions: 'View All Auctions',
    viewStore: 'Visit Store',
    sellerFeedback: 'Seller Feedback',
    positiveReviews: 'positive',
    itemsSold: 'items sold',

    // About This Seller
    aboutThisSeller: 'About This Seller',
    joinedDate: 'Joined',
    detailedSellerRatings: 'Detailed Seller Ratings',

    // Shipping & Location
    shipping: 'Shipping',
    delivery: 'Delivery',
    payments: 'Payments',
    located: 'Located in',
    seeItemDescription: 'See item description for shipping details',
    fullPaymentRequired: 'Full payment is required within',
    withinDaysOfClose: 'days of listing close',
    varies: 'Varies',
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Load language from localStorage
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || 'MN';
  });

  useEffect(() => {
    // Save language to localStorage
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'MN' ? 'EN' : 'MN');
  };

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t // translation function
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;

