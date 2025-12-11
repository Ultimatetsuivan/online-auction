# FilterSidebar Integration Guide

## Step 1: Import the FilterSidebar Component

Add this import to your `product.jsx`:

```javascript
import { FilterSidebar } from '../../components/FilterSidebar';
```

## Step 2: Consolidate Your Filter State

Replace your individual filter states with a unified `filters` object:

```javascript
// BEFORE (multiple states):
const [selectedCategories, setSelectedCategories] = useState([]);
const [selectedBrands, setSelectedBrands] = useState([]);
const [priceRange, setPriceRange] = useState({ min: '', max: '' });
const [selectedCondition, setSelectedCondition] = useState('all');
const [selectedStatus, setSelectedStatus] = useState('all');
const [selectedColors, setSelectedColors] = useState([]);
const [selectedSizes, setSelectedSizes] = useState([]);
const [verifiedSeller, setVerifiedSeller] = useState(false);
const [hasDiscount, setHasDiscount] = useState(false);
const [freeShipping, setFreeShipping] = useState(false);
const [verifiedProduct, setVerifiedProduct] = useState(false);
const [automotiveFilters, setAutomotiveFilters] = useState({...});

// AFTER (unified filters object):
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
  hasDiscount: false,
  freeShipping: false,
  verifiedProduct: false,
  // Automotive filters
  automotiveManufacturer: '',
  automotiveModel: '',
  engineType: '',
  yearFrom: '',
  yearTo: '',
  gearbox: ''
});
```

## Step 3: Create Filter Change Handler

Add this handler function:

```javascript
const handleFiltersChange = (name, value) => {
  if (name === 'clearAll') {
    // Reset all filters
    setFilters({
      selectedCategories: [],
      selectedBrands: [],
      priceMin: '',
      priceMax: '',
      condition: '',
      status: '',
      selectedColors: [],
      selectedSizes: [],
      verifiedSeller: false,
      hasDiscount: false,
      freeShipping: false,
      verifiedProduct: false,
      automotiveManufacturer: '',
      automotiveModel: '',
      engineType: '',
      yearFrom: '',
      yearTo: '',
      gearbox: ''
    });
    setSelectedCategories([]);
    setSelectedCategory('all');
    return;
  }

  setFilters(prev => ({
    ...prev,
    [name]: value
  }));

  // Sync with old state variables for backward compatibility
  if (name === 'selectedCategories') {
    setSelectedCategories(value);
    if (value.length > 0) {
      setSelectedCategory(value[0]);
    }
  }
  if (name === 'selectedBrands') setSelectedBrands(value);
  if (name === 'priceMin' || name === 'priceMax') {
    setPriceRange(prev => ({
      ...prev,
      [name === 'priceMin' ? 'min' : 'max']: value
    }));
  }
  if (name === 'condition') setSelectedCondition(value || 'all');
  if (name === 'status') setSelectedStatus(value || 'all');
  if (name === 'selectedColors') setSelectedColors(value);
  if (name === 'selectedSizes') setSelectedSizes(value);
  if (name === 'verifiedSeller') setVerifiedSeller(value);
  if (name === 'hasDiscount') setHasDiscount(value);
  if (name === 'freeShipping') setFreeShipping(value);
  if (name === 'verifiedProduct') setVerifiedProduct(value);
};
```

## Step 4: Replace the Sidebar JSX

Find your current sidebar code (around line 698-1692) and replace it with:

```javascript
<div className="col-md-3 d-none d-md-block">
  <FilterSidebar
    filters={filters}
    onFiltersChange={handleFiltersChange}
    categories={categories}
    brands={brands}
    showAutomotiveFilters={isAutomotiveCategory()}
  />
</div>
```

## Step 5: Update Mobile Filter View (Optional)

For mobile view, you can also use the FilterSidebar:

```javascript
{showFilters && (
  <div className="col-12 d-md-none mb-4">
    <div className="position-relative">
      <button
        className="btn btn-sm btn-light position-absolute top-0 end-0 m-3"
        style={{ zIndex: 1000 }}
        onClick={() => setShowFilters(false)}
      >
        <FaTimes />
      </button>
      <FilterSidebar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        categories={categories}
        brands={brands}
        showAutomotiveFilters={isAutomotiveCategory()}
      />
    </div>
  </div>
)}
```

## Complete Example Usage

```javascript
import React, { useState, useEffect } from 'react';
import { FilterSidebar } from '../../components/FilterSidebar';

export const Product = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Unified filters state
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
    hasDiscount: false,
    freeShipping: false,
    verifiedProduct: false,
    automotiveManufacturer: '',
    automotiveModel: '',
    engineType: '',
    yearFrom: '',
    yearTo: '',
    gearbox: ''
  });

  const handleFiltersChange = (name, value) => {
    if (name === 'clearAll') {
      setFilters({
        selectedCategories: [],
        selectedBrands: [],
        priceMin: '',
        priceMax: '',
        condition: '',
        status: '',
        selectedColors: [],
        selectedSizes: [],
        verifiedSeller: false,
        hasDiscount: false,
        freeShipping: false,
        verifiedProduct: false,
        automotiveManufacturer: '',
        automotiveModel: '',
        engineType: '',
        yearFrom: '',
        yearTo: '',
        gearbox: ''
      });
      return;
    }

    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const isAutomotiveCategory = () => {
    // Your existing logic
    return filters.selectedCategories.some(catId => {
      const category = categories.find(c => c._id.toString() === catId);
      const title = (category?.titleMn || category?.title || '').toLowerCase();
      return title.includes('тээврийн хэрэгсэл') || title.includes('automotive');
    });
  };

  return (
    <div className="container-fluid px-4 py-5">
      <div className="row">
        {/* Desktop Sidebar */}
        <div className="col-md-3 d-none d-md-block">
          <FilterSidebar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            categories={categories}
            brands={brands}
            showAutomotiveFilters={isAutomotiveCategory()}
          />
        </div>

        {/* Products Grid */}
        <div className="col-md-9">
          {/* Your product list */}
        </div>
      </div>
    </div>
  );
};
```

## Benefits of This Approach

1. **Cleaner Code**: All filter UI logic is in one reusable component
2. **Mercari-Style UX**: Collapsible sections with clean design
3. **Unified State**: Single `filters` object is easier to manage
4. **Responsive**: Works on desktop and mobile
5. **Dark Mode Support**: Automatically adapts to theme
6. **Extensible**: Easy to add new filter types
7. **Automotive Integration**: Seamlessly shows/hides automotive filters

## Customization

You can customize the FilterSidebar by:

- Modifying colors in the component
- Adding/removing filter sections
- Changing which sections are open by default
- Adding custom validation
- Styling with additional CSS classes
