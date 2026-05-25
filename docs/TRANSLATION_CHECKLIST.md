# Translation Checklist

Use this checklist to track which components have been updated to use translations.

## Web Frontend Components

### Core Pages
- [ ] `frontend/src/screen/home/Home.jsx` - Home page
- [ ] `frontend/src/screen/product/product.jsx` - Product listing page
- [ ] `frontend/src/screen/product/Detail.jsx` - Product detail page
- [ ] `frontend/src/screen/categories/Categories.jsx` - Categories page
- [ ] `frontend/src/screen/brands/Brands.jsx` - Brands page
- [ ] `frontend/src/screen/home/about.jsx` - About page

### Authentication
- [ ] `frontend/src/screen/home/authentication/login.jsx` - Login page
- [ ] `frontend/src/screen/home/authentication/register.jsx` - Register page
- [ ] `frontend/src/screen/home/authentication/forgotpassword.jsx` - Forgot password page
- [ ] `frontend/src/screen/home/authentication/reset.jsx` - Reset password page

### Profile & User
- [ ] `frontend/src/screen/home/profile.jsx` - Profile page
- [ ] `frontend/src/screen/home/UserProfile.jsx` - User profile view
- [ ] `frontend/src/screen/home/admin.jsx` - Admin page
- [ ] `frontend/src/screen/home/edit.jsx` - Edit profile

### My List & Watchlist
- [ ] `frontend/src/screen/mylist/MyList.jsx` - Watchlist page
- [ ] `frontend/src/screen/mylist/MyListSimple.jsx` - Simple watchlist view

### Components - Common
- [x] `frontend/src/components/common/Header.jsx` - Already uses translations
- [ ] `frontend/src/components/common/Footer.jsx` - Footer
- [ ] `frontend/src/components/common/Layout.jsx` - Layout wrapper
- [ ] `frontend/src/components/common/Toast.jsx` - Toast notifications
- [ ] `frontend/src/components/common/ErrorBoundary.jsx` - Error boundary
- [ ] `frontend/src/components/common/Skeleton.jsx` - Loading skeletons
- [ ] `frontend/src/components/common/Chatbot.jsx` - Chatbot
- [ ] `frontend/src/components/common/ThemeToggle.jsx` - Theme toggle
- [ ] `frontend/src/components/common/TinyMCEEditor.jsx` - Rich text editor

### Components - Product Related
- [ ] `frontend/src/components/LikeButton.jsx` - Like button
- [ ] `frontend/src/components/ProductImage.jsx` - Product image
- [ ] `frontend/src/components/Timer.jsx` - Countdown timer
- [ ] `frontend/src/components/MercariProductCard.jsx` - Product card
- [ ] `frontend/src/components/PriceHistoryChart.jsx` - Price chart
- [ ] `frontend/src/components/CategorySuggester.jsx` - Category suggester
- [ ] `frontend/src/components/CarSelector.jsx` - Car selector
- [ ] `frontend/src/components/VehicleInfoForm.jsx` - Vehicle form
- [ ] `frontend/src/components/GlobalClock.jsx` - Global clock
- [ ] `frontend/src/components/DraftStatusIndicator.jsx` - Draft status

### Components - Filters & Search
- [ ] `frontend/src/components/search.jsx` - Search
- [ ] `frontend/src/components/FilterSidebar.jsx` - Filter sidebar
- [ ] `frontend/src/components/FilterSidebarExample.jsx` - Filter example
- [ ] `frontend/src/components/SavedFilters.jsx` - Saved filters

### Components - Bidding & Selling
- [ ] `frontend/src/components/bidding/MyBidsPanel.jsx` - My bids panel
- [ ] `frontend/src/components/selling/SellerDashboard.jsx` - Seller dashboard

### Components - Admin
- [ ] `frontend/src/components/admin/VerificationPanel.jsx` - Verification panel
- [ ] `frontend/src/components/admin/IdentityVerificationPanel.jsx` - Identity verification

### Components - Design System
- [ ] `frontend/src/components/design-system/Button.jsx` - Button
- [ ] `frontend/src/components/design-system/Input.jsx` - Input
- [ ] `frontend/src/components/design-system/Card.jsx` - Card
- [ ] `frontend/src/components/design-system/RichTextEditor.jsx` - Rich text editor
- [ ] `frontend/src/components/design-system/ImageUploader.jsx` - Image uploader

---

## Mobile App Components

### Main Screens
- [ ] `mobile/auctionapp/app/(tabs)/index.tsx` - Home screen
- [ ] `mobile/auctionapp/app/(tabs)/search.tsx` - Search screen
- [ ] `mobile/auctionapp/app/(tabs)/notifications.tsx` - Notifications screen
- [ ] `mobile/auctionapp/app/(tabs)/categories.tsx` - Categories screen
- [ ] `mobile/auctionapp/app/(tabs)/profile.tsx` - Profile screen
- [ ] `mobile/auctionapp/app/(tabs)/selling.tsx` - Selling screen

### Product Screens
- [ ] `mobile/auctionapp/app/product/[id].tsx` - Product detail screen
- [ ] `mobile/auctionapp/app/category/[id].tsx` - Category products screen

### Hidden Screens
- [ ] `mobile/auctionapp/app/(hidden)/login.tsx` - Login screen
- [ ] `mobile/auctionapp/app/(hidden)/register.tsx` - Register screen
- [ ] `mobile/auctionapp/app/(hidden)/forgot-password.tsx` - Forgot password
- [ ] `mobile/auctionapp/app/(hidden)/add-product.tsx` - Add product screen
- [ ] `mobile/auctionapp/app/(hidden)/settings.tsx` - Settings screen
- [ ] `mobile/auctionapp/app/(hidden)/watchlist.tsx` - Watchlist screen
- [ ] `mobile/auctionapp/app/(hidden)/my-bids.tsx` - My bids screen
- [ ] `mobile/auctionapp/app/(hidden)/my-wins.tsx` - My wins screen
- [ ] `mobile/auctionapp/app/(hidden)/my-losses.tsx` - My losses screen
- [ ] `mobile/auctionapp/app/(hidden)/balance.tsx` - Balance screen
- [ ] `mobile/auctionapp/app/(hidden)/categories.tsx` - Categories list
- [ ] `mobile/auctionapp/app/(hidden)/search.tsx` - Advanced search
- [ ] `mobile/auctionapp/app/(hidden)/phone-auth.tsx` - Phone authentication
- [ ] `mobile/auctionapp/app/(hidden)/notification-settings.tsx` - Notification settings
- [ ] `mobile/auctionapp/app/(hidden)/eula-acceptance.tsx` - EULA acceptance
- [ ] `mobile/auctionapp/app/(hidden)/identity-verification.tsx` - Identity verification
- [ ] `mobile/auctionapp/app/(hidden)/request-verification.tsx` - Request verification

### Components
- [ ] `mobile/auctionapp/app/components/AuctionCard.tsx` - Auction card
- [ ] `mobile/auctionapp/app/components/ProductCard.tsx` - Product card
- [ ] `mobile/auctionapp/app/components/Banner.tsx` - Banner
- [ ] `mobile/auctionapp/app/components/CategoryChip.tsx` - Category chip
- [ ] `mobile/auctionapp/app/components/CategoryIcon.tsx` - Category icon
- [ ] `mobile/auctionapp/app/components/CategoriesMenu.tsx` - Categories menu
- [ ] `mobile/auctionapp/app/components/FilterChip.tsx` - Filter chip
- [ ] `mobile/auctionapp/app/components/OptionSheet.tsx` - Option sheet
- [ ] `mobile/auctionapp/app/components/SearchBar.tsx` - Search bar
- [ ] `mobile/auctionapp/app/components/BadgeIcon.tsx` - Badge icon
- [ ] `mobile/auctionapp/app/components/CountdownTimer.tsx` - Countdown timer
- [ ] `mobile/auctionapp/app/components/PaymentModal.tsx` - Payment modal
- [ ] `mobile/auctionapp/app/components/LikeButton.tsx` - Like button
- [ ] `mobile/auctionapp/app/components/VerificationBadge.tsx` - Verification badge
- [ ] `mobile/auctionapp/app/components/DraftStatusBanner.tsx` - Draft status
- [ ] `mobile/auctionapp/app/components/AICategorySuggester.tsx` - AI category suggester
- [ ] `mobile/auctionapp/app/components/IDCardScanner.tsx` - ID card scanner
- [ ] `mobile/auctionapp/app/components/LivenessTestModal.tsx` - Liveness test

---

## Progress Tracking

### Web Frontend
- Total Components: ~60
- Completed: 0
- Remaining: 60

### Mobile App
- Total Components: ~50
- Completed: 0
- Remaining: 50

---

## How to Use This Checklist

1. Start with the most important pages (Home, Product Detail, Login, Register)
2. Work on one component at a time
3. Check off each component as you complete it
4. Test each component after updating
5. Verify language switching works correctly

## Priority Order (Suggested)

### High Priority (User-facing)
1. Home page
2. Product listing and detail pages
3. Login/Register pages
4. Header and Footer
5. Product cards and auction cards

### Medium Priority (Interactive)
1. Profile page
2. Add product form
3. Filters and search
4. Bidding components
5. Notifications

### Low Priority (Admin/Settings)
1. Admin panels
2. Settings pages
3. Advanced features
4. Design system components (if reusable)

---

## Testing Checklist

After updating components, test:
- [ ] Language toggle works on all pages
- [ ] All text changes when switching language
- [ ] No English text remains when Mongolian is selected
- [ ] Text fits properly in buttons and containers
- [ ] Forms work correctly in both languages
- [ ] Error messages display in correct language
- [ ] Success messages display in correct language
- [ ] Navigation works in both languages
- [ ] Mobile responsive design works in both languages

---

## Tips

- Update one page/component at a time to avoid overwhelming changes
- Test frequently to catch issues early
- Keep the translation keys organized and consistent
- Add comments in the code where translations are complex
- Create reusable translated components for common patterns

Good luck! 🎉
