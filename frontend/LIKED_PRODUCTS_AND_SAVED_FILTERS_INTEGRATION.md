# Liked Products & Saved Filters Integration Guide

## Overview

This guide shows you how to integrate two new features into your auction site:
1. **Saved Filters**: Save filter combinations and load them later
2. **Liked Products**: Like products and view them in My List

## Files Created

### Components:
- `frontend/src/components/SavedFilters.jsx` - Save filter button and saved filters dropdown
- `frontend/src/components/LikeButton.jsx` - Heart button for liking products
- `frontend/src/context/LikedProductsContext.jsx` - Context for managing liked products globally
- `frontend/src/hooks/useLikedProducts.js` - Hook for liked products (optional, context is preferred)

### Updated Files:
- `frontend/src/screen/mylist/MyList.jsx` - Now includes "Liked Products" tab

---

## Step 1: Setup the LikedProductsProvider

### 1.1 Update your App.jsx or main entry point

Wrap your app with the `LikedProductsProvider`:

```jsx
// In App.jsx or index.jsx
import { LikedProductsProvider } from './context/LikedProductsContext';

function App() {
  return (
    <LikedProductsProvider>
      {/* Your other providers (LanguageProvider, ThemeProvider, etc.) */}
      <Router>
        {/* Your routes */}
      </Router>
    </LikedProductsProvider>
  );
}
```

**Example with existing providers:**

```jsx
import { LikedProductsProvider } from './context/LikedProductsContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <LikedProductsProvider>
          <BrowserRouter>
            <Routes>
              {/* Your routes */}
            </Routes>
          </BrowserRouter>
        </LikedProductsProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
```

---

## Step 2: Add SavedFilters to Product Page

### 2.1 Import the component in product.jsx:

```jsx
import { SavedFilters } from '../../components/SavedFilters';
```

### 2.2 Add handler for loading saved filters:

```jsx
// In your Product component
const handleLoadFilter = (loadedFilters) => {
  // Update your filters state with loaded values
  setFilters(loadedFilters);

  // Also update individual states for backward compatibility
  if (loadedFilters.selectedCategories) {
    setSelectedCategories(loadedFilters.selectedCategories);
  }
  if (loadedFilters.selectedBrands) {
    setSelectedBrands(loadedFilters.selectedBrands);
  }
  if (loadedFilters.priceMin || loadedFilters.priceMax) {
    setPriceRange({
      min: loadedFilters.priceMin || '',
      max: loadedFilters.priceMax || ''
    });
  }
  // ... update other filter states as needed
};
```

### 2.3 Add the SavedFilters button above your product grid:

```jsx
<div className="col-md-9">
  {/* Header with SavedFilters */}
  <div className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
    <h4 className="m-0">
      {getCurrentFilterName()}
      <span className="badge bg-primary ms-2">{filteredProducts.length}</span>
    </h4>

    {/* Add SavedFilters component here */}
    <div className="d-flex gap-2 align-items-center">
      <SavedFilters
        currentFilters={filters}
        onLoadFilter={handleLoadFilter}
      />

      {/* Your existing sort buttons */}
      <div className="btn-group" role="group">
        <button
          type="button"
          className={`btn btn-sm btn-outline-primary ${sortOption === 'newest' ? 'active' : ''}`}
          onClick={() => setSortOption('newest')}
        >
          Шинэ
        </button>
        {/* ... other sort buttons */}
      </div>
    </div>
  </div>

  {/* Your products grid */}
</div>
```

---

## Step 3: Add LikeButton to Product Cards

### 3.1 Option A: Add to MercariProductCard component

If you're using `MercariProductCard`:

```jsx
// In MercariProductCard.jsx
import { LikeButton } from './LikeButton';

export const MercariProductCard = ({ product, showLikeButton = true }) => {
  return (
    <div className="mercari-card position-relative">
      {/* Like button in top-right corner */}
      {showLikeButton && (
        <div className="position-absolute" style={{ top: '0.5rem', right: '0.5rem', zIndex: 10 }}>
          <LikeButton product={product} size="sm" />
        </div>
      )}

      {/* Rest of your card content */}
      <img src={product.images?.[0]?.url} alt={product.title} />
      <div className="card-body">
        <h5>{product.title}</h5>
        <p>₮{product.currentBid || product.price}</p>
      </div>
    </div>
  );
};
```

### 3.2 Option B: Add directly in product.jsx

```jsx
import { LikeButton } from '../../components/LikeButton';

// In your product card rendering:
<div className="col-md-6 col-lg-4" key={product._id}>
  <div className="card h-100 position-relative">
    {/* Like button */}
    <div className="position-absolute" style={{ top: '0.5rem', right: '0.5rem', zIndex: 10 }}>
      <LikeButton product={product} size="md" />
    </div>

    <img src={product.images?.[0]?.url} alt={product.title} />
    <div className="card-body">
      {/* Your product details */}
    </div>
  </div>
</div>
```

---

## Step 4: Verify MyList Integration

The MyList component has been updated with a new "Liked Products" tab. No additional changes needed!

Navigate to `/mylist` and you should see:
- **Liked Products** tab (shows first by default)
- **Saved Filters** tab
- **Following** tab
- **New Products** tab

---

## Complete Example: Product Page Integration

```jsx
import React, { useState, useEffect } from 'react';
import { SavedFilters } from '../../components/SavedFilters';
import { LikeButton } from '../../components/LikeButton';

export const Product = () => {
  const [filters, setFilters] = useState({
    selectedCategories: [],
    selectedBrands: [],
    priceMin: '',
    priceMax: '',
    condition: '',
    status: '',
    selectedColors: [],
    selectedSizes: [],
    verifiedSeller: false,
    // ... other filters
  });

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Handle loading a saved filter
  const handleLoadFilter = (loadedFilters) => {
    setFilters(loadedFilters);
    // Sync with individual states if needed for backward compatibility
    setSelectedCategories(loadedFilters.selectedCategories || []);
    setSelectedBrands(loadedFilters.selectedBrands || []);
    setPriceRange({
      min: loadedFilters.priceMin || '',
      max: loadedFilters.priceMax || ''
    });
    // ... update other states
  };

  return (
    <div className="container-fluid px-4 py-5">
      <div className="row">
        {/* Sidebar */}
        <div className="col-md-3">
          {/* Your filter sidebar */}
        </div>

        {/* Products Grid */}
        <div className="col-md-9">
          {/* Header with SavedFilters */}
          <div className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
            <h4 className="m-0">
              All Products
              <span className="badge bg-primary ms-2">{filteredProducts.length}</span>
            </h4>

            <div className="d-flex gap-2 align-items-center">
              {/* Saved Filters Component */}
              <SavedFilters
                currentFilters={filters}
                onLoadFilter={handleLoadFilter}
              />

              {/* Sort buttons */}
              <div className="btn-group">
                <button className="btn btn-sm btn-outline-primary">Шинэ</button>
                <button className="btn btn-sm btn-outline-primary">Үнэ ↑</button>
                <button className="btn btn-sm btn-outline-primary">Үнэ ↓</button>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="row g-4">
            {filteredProducts.map((product) => (
              <div key={product._id} className="col-md-6 col-lg-4">
                <div className="card h-100 position-relative">
                  {/* Like Button */}
                  <div className="position-absolute" style={{ top: '0.5rem', right: '0.5rem', zIndex: 10 }}>
                    <LikeButton product={product} size="md" />
                  </div>

                  <img
                    src={product.images?.[0]?.url || '/default.png'}
                    className="card-img-top"
                    alt={product.title}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{product.title}</h5>
                    <p className="text-primary fw-bold">₮{product.currentBid || product.price}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

## Features

### Saved Filters
✅ Save button with active filter count badge
✅ Dropdown showing all saved filters
✅ Each saved filter shows:
  - Filter name
  - Number of active filters
  - Creation date
  - Delete button
  - "Apply" button

✅ Modal for naming filters before saving
✅ Preview of active filters in save modal
✅ LocalStorage persistence
✅ Filters persist across sessions

### Liked Products
✅ Heart button on product cards
✅ Animated heart fill on like
✅ Hover effects
✅ "Liked Products" tab in MyList
✅ Product cards in grid layout
✅ Remove button on each liked product
✅ LocalStorage persistence
✅ Likes persist across sessions

---

## Customization

### Change Like Button Color
In `LikeButton.jsx`:
```jsx
backgroundColor: liked ? '#your-color' : 'rgba(255, 255, 255, 0.9)',
border: liked ? '2px solid #your-color' : '2px solid #dee2e6',
```

### Change Save Filter Button Style
In `SavedFilters.jsx`:
```jsx
<button
  className="btn btn-sm btn-outline-primary"
  style={{
    borderRadius: '20px',  // Make it more rounded
    padding: '0.4rem 1rem',
    backgroundColor: '#your-color'  // Custom color
  }}
>
```

### Add More Filter Options in Save Preview
In `SavedFilters.jsx`, update the preview section to show more filter types.

---

## Troubleshooting

### Liked products not showing in MyList
- Ensure `LikedProductsProvider` wraps your entire app
- Check browser console for errors
- Verify localStorage has `likedProducts` key

### Saved filters not persisting
- Check browser localStorage is enabled
- Verify `localStorage.setItem` is being called
- Check for quota exceeded errors

### Like button not appearing
- Ensure `LikedProductsProvider` is setup
- Check import paths are correct
- Verify product prop is being passed

---

## Browser Support

- Requires localStorage support
- Works in all modern browsers
- IE11+ supported (with polyfills)

---

## Next Steps

1. ✅ Add filters to backend API (optional - currently uses localStorage)
2. ✅ Add notifications when new products match saved filters
3. ✅ Add social sharing for liked products
4. ✅ Export liked products as CSV/PDF
5. ✅ Add filters to user profile sync

Enjoy your new features!
