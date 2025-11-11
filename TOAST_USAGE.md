# Toast Notification System - Usage Guide

## Overview

The Toast notification system provides a modern, non-intrusive way to display notifications to users. It replaces the old `alert()` popups with elegant, auto-dismissing notifications.

## Features

- ✅ **4 notification types**: Success, Error, Warning, Info
- ✅ **Auto-dismiss**: Notifications automatically disappear after 3 seconds (customizable)
- ✅ **Manual close**: Users can dismiss notifications manually
- ✅ **Multiple toasts**: Stack multiple notifications
- ✅ **Smooth animations**: Slide-in animations for better UX
- ✅ **Mobile responsive**: Works perfectly on all screen sizes

## Setup

The toast system is already integrated into the app through `App.jsx`:

```jsx
import { ToastProvider } from './components/common/Toast';

function App() {
  return (
    <ToastProvider>
      {/* Your app content */}
    </ToastProvider>
  );
}
```

## Usage

### 1. Import the hook

```jsx
import { useToast } from '../../components/common/Toast';
```

### 2. Use the hook in your component

```jsx
function MyComponent() {
  const toast = useToast();

  // Your component logic
}
```

### 3. Display notifications

```jsx
// Success notification
toast.success('Your bid has been placed successfully!');

// Error notification
toast.error('Failed to place bid. Please try again.');

// Warning notification
toast.warning('Your balance is running low.');

// Info notification
toast.info('New products are available!');
```

### 4. Custom duration

By default, toasts auto-dismiss after 3 seconds. You can customize this:

```jsx
// Display for 5 seconds
toast.success('Product saved!', 5000);

// Display for 10 seconds
toast.error('Critical error occurred', 10000);

// Never auto-dismiss (user must close manually)
toast.info('Important information', null);
```

## Complete Example

```jsx
import { useState } from 'react';
import { useToast } from '../../components/common/Toast';

function BidForm() {
  const toast = useToast();
  const [bidAmount, setBidAmount] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!bidAmount || bidAmount <= 0) {
      toast.warning('Please enter a valid bid amount');
      return;
    }

    try {
      // Submit bid
      const response = await api.post('/bid', { amount: bidAmount });
      toast.success('Your bid has been placed successfully!');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to place bid';
      toast.error(errorMsg);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="number"
        value={bidAmount}
        onChange={(e) => setBidAmount(e.target.value)}
      />
      <button type="submit">Place Bid</button>
    </form>
  );
}
```

## Migration from alert()

### Before (using alert):
```jsx
if (error) {
  alert('Something went wrong!');
}
```

### After (using toast):
```jsx
if (error) {
  toast.error('Something went wrong!');
}
```

## Best Practices

### 1. Choose the right type

- **Success** (`toast.success`): Successful operations (bid placed, product saved, etc.)
- **Error** (`toast.error`): Failed operations, validation errors
- **Warning** (`toast.warning`): Important warnings, low balance, approaching deadline
- **Info** (`toast.info`): General information, tips, updates

### 2. Keep messages concise

```jsx
// Good ✅
toast.success('Product saved!');

// Too verbose ❌
toast.success('Your product has been successfully saved to the database and will appear in the product list shortly.');
```

### 3. Provide actionable feedback

```jsx
// Good ✅
toast.error('Failed to place bid. Please check your balance.');

// Not helpful ❌
toast.error('Error');
```

### 4. Use appropriate duration

```jsx
// Quick success - 3 seconds (default)
toast.success('Saved!');

// Critical error - longer duration
toast.error('Your session has expired. Please log in again.', 5000);

// Important warning - user must acknowledge
toast.warning('Your auction ends in 5 minutes!', null);
```

## Styling

The toast notifications are styled with the orange theme consistent with your app. The styles are defined in `frontend/src/components/common/Toast.css`.

You can customize the colors by modifying the CSS variables:

```css
/* Success - Green */
.toast-success {
  border-left: 4px solid #22c55e;
}

/* Error - Red */
.toast-error {
  border-left: 4px solid #ef4444;
}

/* Warning - Orange */
.toast-warning {
  border-left: 4px solid #f59e0b;
}

/* Info - Blue */
.toast-info {
  border-left: 4px solid #3b82f6;
}
```

## Skeleton Loaders

In addition to toast notifications, we've also added skeleton loading components to improve perceived performance:

### Usage

```jsx
import { SkeletonCard, SkeletonProductDetail, SkeletonList } from '../../components/common/Skeleton';

// For product cards
{isLoading ? <SkeletonCard /> : <ProductCard data={product} />}

// For product detail pages
{isLoading ? <SkeletonProductDetail /> : <ProductDetail data={product} />}

// For lists
{isLoading ? <SkeletonList count={5} /> : products.map(p => <Item key={p.id} {...p} />)}
```

## Files Modified

All `alert()` calls have been replaced in:
- ✅ `frontend/src/screen/home/authentication/register.jsx` (1 alert replaced)
- ✅ `frontend/src/screen/mylist/MyList.jsx` (2 alerts replaced)
- ✅ `frontend/src/screen/product/product.jsx` (2 alerts replaced)
- ✅ `frontend/src/screen/product/Detail.jsx` (2 alerts replaced + skeleton loader added)
- ✅ `frontend/src/screen/home/profile.jsx` (7 alerts replaced)
- ✅ `frontend/src/screen/home/admin.jsx` (8 alerts replaced)

**Total: 21 alert() calls replaced with toast notifications**

## Mobile App

The mobile product detail page has been completely implemented with:
- ✅ Full image gallery with swipe navigation
- ✅ Bid placement functionality
- ✅ Real-time countdown timer
- ✅ Bid history display
- ✅ Similar products section
- ✅ Haptic feedback on interactions
- ✅ Pull-to-refresh functionality
- ✅ Navigation enabled from home screen

File: `mobile/auctionapp/app/product/[id].tsx`

## Troubleshooting

### Toast not showing up?

1. Make sure `ToastProvider` wraps your component tree in `App.jsx`
2. Verify the import path is correct relative to your component
3. Check browser console for any errors

### Toast appearing in wrong position?

The toast container is positioned at `top: 20px, right: 20px` by default. You can modify this in `Toast.css`.

### Multiple toasts overlapping?

This is expected behavior - toasts stack vertically. They will auto-dismiss in the order they were created.

## Support

For issues or questions, please refer to the main documentation or create an issue in the project repository.
