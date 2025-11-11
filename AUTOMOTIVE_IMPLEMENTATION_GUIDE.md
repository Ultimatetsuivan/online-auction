# 🚀 Automotive Category - Quick Implementation Guide

## 📦 Files to Create

```
frontend/src/
├── pages/
│   └── Automotive.jsx                    # Main page component
├── components/
│   ├── automotive/
│   │   ├── ListingCard.jsx              # Product card
│   │   ├── ListingCardSkeleton.jsx      # Loading skeleton
│   │   ├── CategorySidebar.jsx          # Brand filter sidebar
│   │   ├── FilterBar.jsx                # Top filter controls
│   │   ├── FilterDropdown.jsx           # Individual filter
│   │   ├── SortMenu.jsx                 # Sort dropdown
│   │   ├── ViewToggle.jsx               # Grid/List toggle
│   │   ├── PaginationBar.jsx            # Pagination
│   │   └── MobileFilterSheet.jsx        # Mobile bottom sheet
│   └── common/
│       ├── Breadcrumb.jsx               # Navigation breadcrumb
│       ├── TabSelector.jsx              # Tab navigation
│       └── EmptyState.jsx               # No results state
├── styles/
│   └── automotive.css                    # Page-specific styles
└── hooks/
    ├── useAutomotiveFilters.js          # Filter state management
    ├── useAutomotiveListings.js         # Data fetching
    └── useInfiniteScroll.js             # Infinite scroll (mobile)
```

---

## 🎯 Step-by-Step Implementation

### Phase 1: Basic Structure (Day 1-2)

#### 1. Create Main Page Component
```jsx
// pages/Automotive.jsx
import { useState, useEffect } from 'react';
import { CategorySidebar } from '../components/automotive/CategorySidebar';
import { FilterBar } from '../components/automotive/FilterBar';
import { ListingCard } from '../components/automotive/ListingCard';

export default function AutomotivePage() {
  const [listings, setListings] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);

  return (
    <div className="automotive-page">
      <Breadcrumb items={breadcrumbs} />

      <div className="page-header">
        <h1>Cars & Trucks</h1>
        <span className="results-count">{total} results</span>
      </div>

      <FilterBar filters={filters} onChange={setFilters} />

      <div className="content-wrapper">
        <CategorySidebar />

        <main className="listings-main">
          <div className="listings-grid">
            {listings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
```

#### 2. Create Listing Card Component
```jsx
// components/automotive/ListingCard.jsx
export function ListingCard({ listing, onLike, variant = 'grid' }) {
  const [liked, setLiked] = useState(false);

  return (
    <div className={`listing-card ${variant}`}>
      <div className="card-image">
        <img src={listing.image} alt={listing.title} />
        {listing.badge && <span className="badge">{listing.badge}</span>}
        <button className="like-btn" onClick={() => setLiked(!liked)}>
          <i className={liked ? 'bi-heart-fill' : 'bi-heart'} />
        </button>
      </div>

      <div className="card-content">
        <h3 className="card-title">{listing.title}</h3>
        <p className="card-meta">
          {listing.condition} · {listing.make}
        </p>

        <div className="card-price">
          <span className="price">${listing.price.toLocaleString()}</span>
          {listing.priceType && (
            <span className="price-type">{listing.priceType}</span>
          )}
        </div>

        <div className="card-location">
          <i className="bi-geo-alt" /> {listing.location}
          {listing.shipping && (
            <span><i className="bi-truck" /> +${listing.shipping}</span>
          )}
        </div>

        <button className="btn-view-details">View Details</button>
      </div>
    </div>
  );
}
```

#### 3. Add Basic CSS
```css
/* styles/automotive.css */
.automotive-page {
  max-width: 1440px;
  margin: 0 auto;
  padding: 32px;
}

.content-wrapper {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 32px;
  margin-top: 24px;
}

.listings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.listing-card {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
}

.listing-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

/* Mobile */
@media (max-width: 768px) {
  .content-wrapper {
    grid-template-columns: 1fr;
  }

  .listings-grid {
    grid-template-columns: 1fr;
  }
}
```

---

### Phase 2: Filtering & Sorting (Day 3-4)

#### 4. Create Filter Bar
```jsx
// components/automotive/FilterBar.jsx
import { FilterDropdown } from './FilterDropdown';
import { SortMenu } from './SortMenu';

export function FilterBar({ filters, onChange, onSort }) {
  return (
    <div className="filter-bar">
      <div className="filter-row">
        <FilterDropdown
          label="Transmission"
          options={['Automatic', 'Manual', 'CVT']}
          value={filters.transmission}
          onChange={(val) => onChange({ ...filters, transmission: val })}
        />

        <FilterDropdown
          label="Make"
          options={makes}
          value={filters.make}
          onChange={(val) => onChange({ ...filters, make: val })}
          searchable
        />

        {/* Add more filters */}

        <button className="btn-filter-apply">
          <i className="bi-funnel" /> Filter
        </button>
      </div>

      <div className="filter-actions">
        <SortMenu value={sort} onChange={onSort} />
        <ViewToggle value={view} onChange={setView} />
      </div>
    </div>
  );
}
```

#### 5. Create Custom Hook for Filters
```jsx
// hooks/useAutomotiveFilters.js
export function useAutomotiveFilters(initialFilters = {}) {
  const [filters, setFilters] = useState(initialFilters);
  const [activeFilters, setActiveFilters] = useState([]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilter = (key) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  const clearAll = () => {
    setFilters({});
  };

  useEffect(() => {
    const active = Object.entries(filters)
      .filter(([_, value]) => value)
      .map(([key, value]) => ({ key, value }));
    setActiveFilters(active);
  }, [filters]);

  return {
    filters,
    activeFilters,
    updateFilter,
    clearFilter,
    clearAll,
  };
}
```

#### 6. Create Data Fetching Hook
```jsx
// hooks/useAutomotiveListings.js
import { useState, useEffect } from 'react';
import axios from 'axios';

export function useAutomotiveListings(filters, sort, page) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchListings() {
      setLoading(true);
      try {
        const response = await axios.get('/api/listings/automotive', {
          params: {
            ...filters,
            sort,
            page,
            limit: 20,
          },
        });

        setListings(response.data.listings);
        setTotal(response.data.total);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, [filters, sort, page]);

  return { listings, loading, total, error };
}
```

---

### Phase 3: Mobile Optimization (Day 5)

#### 7. Create Mobile Filter Sheet
```jsx
// components/automotive/MobileFilterSheet.jsx
import { useState } from 'react';
import { Sheet } from 'react-modal-sheet';

export function MobileFilterSheet({ open, onClose, filters, onChange }) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    onChange(localFilters);
    onClose();
  };

  return (
    <Sheet isOpen={open} onClose={onClose}>
      <Sheet.Container>
        <Sheet.Header>
          <h3>Filters</h3>
          <button onClick={onClose}>✕</button>
        </Sheet.Header>

        <Sheet.Content>
          <div className="filter-sections">
            <FilterSection title="Transmission">
              {/* Checkboxes */}
            </FilterSection>

            <FilterSection title="Make">
              {/* Searchable list */}
            </FilterSection>

            {/* More sections */}
          </div>
        </Sheet.Content>

        <Sheet.Footer>
          <button onClick={() => setLocalFilters({})}>
            Clear All
          </button>
          <button className="btn-primary" onClick={handleApply}>
            Apply Filters ({activeCount})
          </button>
        </Sheet.Footer>
      </Sheet.Container>
      <Sheet.Backdrop />
    </Sheet>
  );
}
```

#### 8. Add Mobile Sticky Filter Button
```jsx
// In Automotive.jsx (mobile view)
<div className="mobile-filter-bar">
  <button
    className="btn-filters"
    onClick={() => setFilterSheetOpen(true)}
  >
    <i className="bi-funnel" /> Filters
    {activeFilterCount > 0 && (
      <span className="badge">{activeFilterCount}</span>
    )}
  </button>

  <SortMenu value={sort} onChange={setSort} />

  <ViewToggle value={view} onChange={setView} />
</div>

<MobileFilterSheet
  open={filterSheetOpen}
  onClose={() => setFilterSheetOpen(false)}
  filters={filters}
  onChange={setFilters}
/>
```

---

### Phase 4: Polish & Performance (Day 6-7)

#### 9. Add Loading Skeletons
```jsx
// components/automotive/ListingCardSkeleton.jsx
export function ListingCardSkeleton() {
  return (
    <div className="listing-card skeleton">
      <div className="skeleton-image" />
      <div className="skeleton-content">
        <div className="skeleton-title" />
        <div className="skeleton-meta" />
        <div className="skeleton-price" />
        <div className="skeleton-button" />
      </div>
    </div>
  );
}

// Add animation
.skeleton {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

#### 10. Add Infinite Scroll (Mobile)
```jsx
// hooks/useInfiniteScroll.js
import { useEffect, useRef, useCallback } from 'react';

export function useInfiniteScroll(callback, hasMore, loading) {
  const observer = useRef();

  const lastElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        callback();
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore, callback]);

  return lastElementRef;
}

// Usage in component
const lastListingRef = useInfiniteScroll(
  () => setPage(prev => prev + 1),
  hasMore,
  loading
);
```

#### 11. Add Image Lazy Loading
```jsx
// In ListingCard.jsx
<img
  src={listing.image}
  alt={listing.title}
  loading="lazy"
  onError={(e) => e.target.src = '/placeholder-car.jpg'}
/>
```

#### 12. Add Analytics Tracking
```jsx
// Track filter usage
const trackFilter = (filterName, value) => {
  analytics.track('Filter Applied', {
    category: 'Automotive',
    filter: filterName,
    value: value,
  });
};

// Track card views
const trackCardView = (listingId) => {
  analytics.track('Listing Viewed', {
    listingId,
    category: 'Automotive',
  });
};
```

---

## 🎨 Styling Checklist

### Required CSS Files

1. **automotive.css** - Main page styles
2. **listing-card.css** - Card component styles
3. **filters.css** - Filter bar and dropdowns
4. **mobile.css** - Mobile-specific overrides

### Key CSS Variables (Already defined in themes.css)
```css
:root {
  --color-primary: #FFA239;
  --color-secondary: #8CE4FF;
  --color-warning: #FEEE91;
  --color-danger: #FF5656;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 24px;
  --spacing-2xl: 32px;
}
```

---

## 🔌 Backend API Requirements

### Required Endpoints

```javascript
// GET /api/listings/automotive
// Query params: filters, sort, page, limit
{
  listings: [...],
  total: 61665,
  pages: 3084,
  currentPage: 1
}

// GET /api/automotive/makes
// Returns list of car makes with count
[
  { name: 'BMW', count: 5100 },
  { name: 'Audi', count: 2300 },
  ...
]

// GET /api/automotive/models?make=BMW
// Returns models for a specific make
[
  { name: '3 Series', count: 1200 },
  { name: '5 Series', count: 890 },
  ...
]

// POST /api/listings/:id/like
// Toggle like on a listing

// POST /api/listings/:id/view
// Track listing view
```

---

## 📱 Testing Checklist

### Desktop (1440px)
- [ ] All 3 columns visible
- [ ] Sidebar sticky on scroll
- [ ] Hover states working
- [ ] Filter dropdowns functional
- [ ] Sort menu works
- [ ] Pagination works
- [ ] Card hover effects smooth

### Tablet (768px-1024px)
- [ ] 2 column grid
- [ ] Sidebar still visible
- [ ] All filters accessible
- [ ] Touch-friendly buttons

### Mobile (<768px)
- [ ] Single column layout
- [ ] Bottom filter sheet opens
- [ ] Infinite scroll works
- [ ] Sticky filter bar
- [ ] Swipe actions work
- [ ] Touch targets 44px min

### Functionality
- [ ] Filters apply correctly
- [ ] Sort changes order
- [ ] Like button toggles
- [ ] Loading skeletons show
- [ ] Empty state displays
- [ ] Error handling works
- [ ] Back button preserves filters

### Performance
- [ ] Images lazy load
- [ ] Smooth scrolling
- [ ] No layout shift
- [ ] Fast filter response
- [ ] Cached API calls

---

## 🚀 Deployment Steps

1. **Environment Variables**
```bash
VITE_API_URL=https://api.yoursite.com
VITE_CDN_URL=https://cdn.yoursite.com
VITE_ANALYTICS_ID=your-analytics-id
```

2. **Build Command**
```bash
npm run build
```

3. **Optimize Images**
```bash
# Convert to WebP
npm run optimize-images
```

4. **Test Production Build**
```bash
npm run preview
```

5. **Deploy**
```bash
npm run deploy
```

---

## 📊 Success Metrics

Track these KPIs:
- **Page Load Time**: < 3 seconds
- **Filter Application**: < 500ms
- **Image Load**: < 2 seconds
- **Bounce Rate**: < 40%
- **Time on Page**: > 2 minutes
- **Filter Usage**: > 60% of users
- **Mobile Conversion**: > 50% of traffic

---

## 🐛 Common Issues & Solutions

### Issue: Filters not applying
**Solution**: Check that API query params match filter state

### Issue: Images not loading
**Solution**: Verify image URLs and add error handling

### Issue: Sidebar not sticky
**Solution**: Ensure parent container has proper height

### Issue: Mobile sheet not opening
**Solution**: Check z-index and ensure backdrop is clickable

### Issue: Infinite scroll loading too early
**Solution**: Adjust intersection observer threshold

---

## 📚 Resources

- [Design Document](./AUTOMOTIVE_LAYOUT_DESIGN.md)
- [Wireframes](./AUTOMOTIVE_WIREFRAME.md)
- [Color Scheme](./COLOR_SCHEME.md)
- [API Documentation](./API_DOCS.md)

---

**Ready to Build!** 🎉

Follow these steps in order for a systematic implementation of the automotive category page.
