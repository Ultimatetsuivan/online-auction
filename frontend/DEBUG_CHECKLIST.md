# Debug Checklist - MyList Not Showing Correctly

## Quick Fix Steps (Do These First!)

### Step 1: Hard Refresh Browser
1. Open your site in browser
2. Press **Ctrl + Shift + R** (Windows) or **Cmd + Shift + R** (Mac)
3. This clears cache and forces reload

### Step 2: Clear Browser Cache Completely
1. Press **Ctrl + Shift + Delete**
2. Select "Cached images and files"
3. Select "All time"
4. Click "Clear data"
5. Refresh page

### Step 3: Restart Your Development Server
```bash
# Stop the server (Ctrl + C)
# Then restart:
cd C:\Users\bukhbtu01\Downloads\onlineauction-clean\frontend
npm run dev
```

### Step 4: Check Browser Console for Errors
1. Press **F12** to open Developer Tools
2. Go to "Console" tab
3. Look for RED error messages
4. Take screenshot and check them

---

## Verification Tests

### Test 1: Check if LikedProductsProvider is Working

Open browser console (F12) and type:
```javascript
localStorage.setItem('likedProducts', JSON.stringify([
  {
    "_id": "test123",
    "title": "Test Product",
    "price": 50000,
    "currentBid": 50000,
    "images": [{ "url": "/default.png", "isPrimary": true }],
    "likedAt": new Date().toISOString()
  }
]));
```

Then refresh `/mylist` page. You should see 1 liked product.

### Test 2: Check if SavedFilters is Working

Open browser console (F12) and type:
```javascript
localStorage.setItem('savedFilters', JSON.stringify([
  {
    "id": "test" + Date.now(),
    "name": "Test Filter",
    "filters": {
      "selectedCategories": [],
      "priceMin": "10000",
      "priceMax": "50000"
    },
    "createdAt": new Date().toISOString()
  }
]));
```

Then refresh `/mylist` page. You should see 1 saved filter.

### Test 3: Check LocalStorage Data

Open browser console (F12) and type:
```javascript
console.log('Liked Products:', localStorage.getItem('likedProducts'));
console.log('Saved Filters:', localStorage.getItem('savedFilters'));
```

You should see the data if anything is saved.

---

## Check Files Were Updated

### Verify App.jsx has LikedProductsProvider

Open `frontend/src/App.jsx` and verify it has:
```javascript
import { LikedProductsProvider } from './context/LikedProductsContext';

// And in the return:
<LikedProductsProvider>
  <ToastProvider>
    {/* ... */}
  </ToastProvider>
</LikedProductsProvider>
```

### Verify MyList.jsx has useLikedProducts

Open `frontend/src/screen/mylist/MyList.jsx` and verify line 11:
```javascript
import { useLikedProducts } from '../../context/LikedProductsContext';
```

And line 18:
```javascript
const { likedProducts, removeLike } = useLikedProducts();
```

---

## Common Issues & Solutions

### Issue 1: "useLikedProducts is not a function"
**Solution**:
1. Check `App.jsx` has `LikedProductsProvider` wrapper
2. Restart dev server
3. Hard refresh browser

### Issue 2: "Cannot read property 'length' of undefined"
**Solution**:
1. The context isn't loading
2. Check browser console for errors in `LikedProductsContext.jsx`
3. Make sure the file exists at `frontend/src/context/LikedProductsContext.jsx`

### Issue 3: Tabs show but content is wrong
**Solution**:
1. Clear localStorage: `localStorage.clear()`
2. Refresh page
3. Try adding test data (see Test 1 & 2 above)

### Issue 4: Old code still showing
**Solution**:
1. Stop dev server
2. Delete `node_modules/.cache` folder if it exists
3. Restart dev server
4. Hard refresh browser (Ctrl + Shift + R)

---

## Nuclear Option (If Nothing Works)

```bash
# Stop dev server (Ctrl + C)

# Clear everything
cd C:\Users\bukhbtu01\Downloads\onlineauction-clean\frontend
rmdir /s /q node_modules\.cache
rmdir /s /q .next
rmdir /s /q dist

# Restart
npm run dev
```

Then in browser:
1. Clear all site data (Ctrl + Shift + Delete)
2. Open in incognito mode
3. Navigate to `/mylist`

---

## What You Should See

### When it's working correctly:

#### MyList Page should have 4 tabs:
```
┌─────────────────────────────────────┐
│ My List                              │
├─────────────────────────────────────┤
│                                      │
│ ❤️  Liked Products (0)              │
│ 🔖 Saved Filters (0)                │
│ 👥 Following (0)                    │
│ 📦 New Products (0)                 │
│                                      │
└─────────────────────────────────────┘
```

#### Product page should have:
```
All Products (50)  [Шүүлтүүр хадгалах] [Хадгалсан шүүлтүүр] [Sort buttons]
```

#### Product cards should have:
```
┌──────────┐
│    ❤️    │  ← Heart button top-right
│  [IMG]   │
│  Title   │
│  ₮50,000 │
└──────────┘
```

---

## Still Not Working?

If after ALL these steps it's still not working, please:

1. Take screenshot of browser console (F12 → Console tab)
2. Take screenshot of `/mylist` page
3. Check what's in localStorage:
   ```javascript
   // In browser console:
   Object.keys(localStorage).forEach(key => {
     console.log(key + ':', localStorage.getItem(key));
   });
   ```
4. Take screenshot of that output

Then I can help debug further!

---

## Quick Test Script

Copy this entire block into browser console on `/mylist` page:

```javascript
// Test everything
console.log('=== MyList Debug Info ===');
console.log('Liked Products in localStorage:', localStorage.getItem('likedProducts'));
console.log('Saved Filters in localStorage:', localStorage.getItem('savedFilters'));

// Add test data
localStorage.setItem('likedProducts', JSON.stringify([
  { _id: "test1", title: "Test Product 1", price: 10000, images: [{url: "/default.png", isPrimary: true}] },
  { _id: "test2", title: "Test Product 2", price: 20000, images: [{url: "/default.png", isPrimary: true}] }
]));

localStorage.setItem('savedFilters', JSON.stringify([
  { id: "testfilter1", name: "Test Filter 1", filters: { priceMin: "1000", priceMax: "5000" }, createdAt: new Date().toISOString() },
  { id: "testfilter2", name: "Test Filter 2", filters: { selectedCategories: ["cat1"] }, createdAt: new Date().toISOString() }
]));

console.log('✅ Test data added! Now refresh the page.');
console.log('You should see:');
console.log('  - 2 liked products');
console.log('  - 2 saved filters');
```

After running this, **refresh the page**. You should see 2 liked products and 2 saved filters!
