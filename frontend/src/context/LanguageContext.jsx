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
    profile: 'Миний профайл',
    adminPanel: 'Админ панел',
    login: 'Нэвтрэх',
    signup: 'Бүртгүүлэх',
    logout: 'Гарах',
    
    // Home Page
    recommended: 'Санал болгох',
    trendingItems: 'Тренд бараа',
    trendingCategories: 'Тренд ангилал',
    trendingBrands: 'Тренд брэнд',
    recentlyViewed: 'Сүүлийн үзсэн',
    recommendedProducts: 'Санал болгосон бараа',
    viewAll: 'Бүгдийг харах',
    placeBid: 'Санал тавих',
    currentBid: 'Одоогийн санал:',
    timeLeft: 'Өдөр:',
    items: 'ширхэг',
    
    // Notifications
    notifications: 'Мэдэгдэл',
    markAllRead: 'Бүгдийг уншсан',
    new: 'Шинэ',
    viewAllNotifications: 'Бүх мэдэгдлийг үзэх',
    
    // Search
    searchPlaceholder: 'Хайх...',
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
    noNewProducts: 'Дарадаг хэрэглэгчдээс шинэ бараа байхгүй байна',
    
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
  },
  EN: {
    // Navigation
    home: 'Home',
    auctions: 'Auctions',
    about: 'About',
    myList: 'My List',
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

