# Dark Mode Guide

## Overview

Your auction site now features a **dark mode** toggle that transforms the entire site into a dark theme for better eye comfort, especially in low-light environments.

## Features

### Light Mode (Default)
- 🌞 Bright white background
- 📝 Dark text for easy reading
- 🟠 Orange accent color (#FF6A00)

### Dark Mode
- 🌙 Dark background (#0F172A)
- ✨ Light text (#F1F5F9)
- 🟠 Same orange accent color
- 👁️ Reduced eye strain in low light

## How to Use

### Option 1: Header Toggle (Quick)
1. Look at the header (top right)
2. Click the **moon icon** (🌙) to enable dark mode
3. Click the **sun icon** (☀️) to go back to light mode

### Option 2: Profile Settings (Persistent)
1. Log in to your account
2. Go to **Profile** page
3. Click on **"Тохиргоо" (Settings)** in the sidebar
4. Toggle the **"Харанхуй горим" (Dark Mode)** switch

## Features

✅ **Instant switching** - Changes apply immediately
✅ **Persistent** - Your choice is saved across sessions
✅ **Comprehensive** - All pages and components support dark mode
✅ **Eye-friendly** - Optimized colors for comfortable viewing
✅ **Professional** - Clean, modern dark theme design

## Technical Details

### Files Modified

1. **ThemeContext** - `frontend/src/context/ThemeContext.jsx`
   - Manages light/dark mode state
   - Saves preference to localStorage
   - Applies theme class to body element

2. **Theme Styles** - `frontend/src/styles/themes.css`
   - Complete dark theme CSS
   - CSS variables for easy customization
   - Smooth transitions between themes

3. **ThemeToggle Component** - `frontend/src/components/common/ThemeToggle.jsx`
   - Moon/Sun icon button
   - Can be used anywhere in the app

4. **Profile Settings** - `frontend/src/screen/home/profile.jsx`
   - Dark mode toggle in settings
   - Persistent preference

5. **Header** - `frontend/src/components/common/Header.jsx`
   - Quick access dark mode toggle

### For Developers

#### Use Dark Mode in Your Components

```jsx
import { useTheme } from './context/ThemeContext';

function MyComponent() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div>
      {isDarkMode ? 'Dark Mode is ON' : 'Light Mode is ON'}
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}
```

#### Check Current Theme

```jsx
const { isDarkMode } = useTheme();

if (isDarkMode) {
  // Show dark mode specific content
}
```

## CSS Classes

The theme system adds classes to the `<body>` element:

- `.theme-light` - Light mode (default)
- `.theme-dark` - Dark mode

All Bootstrap and custom components automatically adapt using CSS variables and theme-specific selectors.

## CSS Variables

### Light Mode
```css
--color-background: #FFFFFF
--color-text: #0F172A
--color-surface: #F8FAFC
--color-border: #E2E8F0
```

### Dark Mode
```css
--color-background: #0F172A
--color-text: #F1F5F9
--color-surface: #1E293B
--color-border: #334155
```

## Supported Components

All these components work perfectly in dark mode:

- ✅ Cards and surfaces
- ✅ Forms and inputs
- ✅ Navigation and header
- ✅ Buttons and links
- ✅ Dropdowns and modals
- ✅ Tables and lists
- ✅ Alerts and badges
- ✅ Product cards
- ✅ Scrollbars
- ✅ Tooltips

## Fixes Applied

### Text Visibility
- All headings, paragraphs, and labels are now visible in dark mode
- Input text and placeholders are properly colored
- Links maintain good contrast

### Background Colors
- Cards and surfaces use appropriate dark backgrounds
- Forms and inputs have proper dark backgrounds
- No white flashes or visibility issues

### Borders and Shadows
- Borders use darker colors that work with dark backgrounds
- Shadows adjusted for dark mode
- Proper hover effects

## Login/Register Fix

**Fixed:** Users can no longer swipe back to login page after logging in.

The navigation after login now uses `replace: true`, which prevents the back button from returning to the login page. This applies to:
- Login page
- Register page
- Google OAuth login
- Email verification

## Browser Compatibility

Works on all modern browsers:
- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

## Persistence

Your dark mode preference is saved to `localStorage`:
```javascript
localStorage.getItem('darkMode') // 'true' or 'false'
```

The setting persists across:
- Page reloads
- Browser sessions
- Different tabs
- Mobile and desktop

## Benefits

### For Users
- 🌙 Better for nighttime browsing
- 👁️ Reduces eye strain
- 🔋 Saves battery on OLED screens
- ✨ Modern, professional look

### For Developers
- 🎨 Easy to customize
- 📦 Modular implementation
- 🔧 Simple API
- 📝 Well documented

## Troubleshooting

### Dark mode not applying?
1. Check that ThemeProvider wraps your app in `App.jsx`
2. Verify `themes.css` is imported
3. Clear browser cache

### Some text not visible?
1. The CSS includes comprehensive fixes for text visibility
2. Check if custom styles are overriding theme variables
3. Ensure you're using theme variables in custom CSS

### Preference not saving?
1. Check browser localStorage is enabled
2. Verify no extensions are blocking localStorage
3. Try clearing localStorage and toggling again

## Future Enhancements

Possible additions:
- 🎨 Multiple theme options (e.g., high contrast)
- 🌓 Auto dark mode based on system preferences
- ⏰ Scheduled dark mode (e.g., sunset to sunrise)
- 🎨 Custom accent colors

## Support

For issues or questions:
1. Check this documentation
2. Verify theme CSS is loaded
3. Check browser console for errors
4. Test in incognito mode

---

**Enjoy your new dark mode!** 🌙✨
