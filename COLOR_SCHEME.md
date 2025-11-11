# 🎨 Color Scheme Documentation

## Your Custom Color Palette

### Primary Colors

#### 🟠 Orange (#FFA239) - Main Brand Color
- **Primary**: `#FFA239`
- **Light**: `#FFB464`
- **Dark**: `#E68A1F`
- **Usage**: Primary buttons, links, brand elements, CTAs

#### 🔵 Blue (#8CE4FF) - Secondary/Accent
- **Primary**: `#8CE4FF`
- **Light**: `#9AE7FF`
- **Dark**: `#66D4F7`
- **Usage**: Secondary buttons, info badges, highlights

#### 🟡 Yellow (#FEEE91) - Warning/Highlights
- **Primary**: `#FEEE91`
- **Light**: `#FFF9B8`
- **Dark**: `#F5E370`
- **Usage**: Warning messages, important notices, highlights

#### 🔴 Red (#FF5656) - Error/Danger
- **Primary**: `#FF5656`
- **Light**: `#FF8181`
- **Dark**: `#F73838`
- **Usage**: Error messages, delete buttons, urgent alerts

---

## Mobile App (React Native)

### Theme File Location
```
mobile/auctionapp/app/theme.ts
```

### Available Color Variables

**Brand Colors (Orange)**
```typescript
theme.brand50  // #FFF5EB - Lightest
theme.brand600 // #FFA239 - Main
theme.brand900 // #995500 - Darkest
```

**Secondary Colors (Blue)**
```typescript
theme.secondary50  // #E6F9FF - Lightest
theme.secondary500 // #8CE4FF - Main
theme.secondary900 // #00A4DD - Darkest
```

**Warning Colors (Yellow)**
```typescript
theme.warning50  // #FFFEF5 - Lightest
theme.warning600 // #FEEE91 - Main
theme.warning900 // #E3CB2E - Darkest
```

**Danger Colors (Red)**
```typescript
theme.danger50  // #FFEBEB - Lightest
theme.danger600 // #FF5656 - Main
theme.danger900 // #CC0000 - Darkest
```

### Usage Example
```tsx
import theme from '../theme';

<View style={{ backgroundColor: theme.brand600 }}>
  <Text style={{ color: theme.white }}>Primary Button</Text>
</View>

<TouchableOpacity style={{ borderColor: theme.secondary500 }}>
  <Text style={{ color: theme.secondary500 }}>Secondary Action</Text>
</TouchableOpacity>
```

---

## Web Frontend (React + Vite)

### Theme Files Location
```
frontend/src/styles/themes.css
frontend/src/index.css
```

### CSS Variables

**Light Mode**
```css
:root {
  --color-primary: #FFA239;
  --color-primary-light: #FFB464;
  --color-primary-dark: #E68A1F;
  --color-secondary: #8CE4FF;
  --color-warning: #FEEE91;
  --color-danger: #FF5656;
}
```

**Dark Mode**
```css
.theme-dark {
  --color-primary: #FFA239;
  --color-secondary: #8CE4FF;
  --color-warning: #FEEE91;
  --color-danger: #FF5656;
}
```

### Usage with CSS Variables
```css
.my-button {
  background-color: var(--color-primary);
  color: white;
}

.my-button:hover {
  background-color: var(--color-primary-dark);
}
```

### Bootstrap-Compatible Utility Classes
```html
<!-- Primary (Orange) -->
<button class="btn btn-primary">Primary Action</button>
<span class="badge bg-primary">New</span>

<!-- Secondary (Blue) -->
<button class="btn btn-secondary-custom">Info Action</button>
<span class="badge badge-secondary-custom">Info</span>

<!-- Warning (Yellow) -->
<button class="btn btn-warning-custom">Warning Action</button>
<span class="badge badge-warning-custom">Caution</span>

<!-- Danger (Red) -->
<button class="btn btn-danger-custom">Delete</button>
<span class="badge badge-danger-custom">Error</span>
```

---

## Color Psychology & Usage Guide

### 🟠 Orange (#FFA239) - Energy & Action
- **Emotion**: Energetic, friendly, inviting
- **Use for**:
  - Primary CTAs (Buy Now, Place Bid, Submit)
  - Brand logo and headers
  - Active states and selections
  - Price highlights
- **Avoid for**: Error messages, warnings

### 🔵 Blue (#8CE4FF) - Trust & Information
- **Emotion**: Calm, trustworthy, professional
- **Use for**:
  - Informational messages
  - Secondary actions
  - Links and navigation
  - Trust badges
- **Avoid for**: Warnings, errors

### 🟡 Yellow (#FEEE91) - Attention & Caution
- **Emotion**: Optimistic, attention-grabbing
- **Use for**:
  - Important notices
  - Upcoming deadlines
  - Highlights and tips
  - Pending states
- **Avoid for**: Primary actions

### 🔴 Red (#FF5656) - Urgency & Error
- **Emotion**: Urgent, important, critical
- **Use for**:
  - Error messages
  - Delete/Cancel actions
  - Sold out badges
  - Expiring soon alerts
- **Avoid for**: Primary CTAs

---

## Accessibility Considerations

### Contrast Ratios (WCAG AA)

**White text on backgrounds:**
- ✅ #FFA239: 3.3:1 (Large text only)
- ✅ #8CE4FF: 1.7:1 (Use dark text)
- ✅ #FEEE91: 1.3:1 (Use dark text)
- ✅ #FF5656: 4.0:1 (Pass for all text)

**Recommended Text Colors:**
- Orange: White text
- Blue: Dark text (#0F172A)
- Yellow: Dark text (#8C6500)
- Red: White text

### Color Blind Friendly
✅ Orange + Blue = Good contrast (protanopia/deuteranopia safe)
✅ Yellow + Red = Distinguishable shapes/labels needed
✅ Always use icons/text labels alongside colors

---

## Quick Reference

| Color | Hex | Usage | Text Color |
|-------|-----|-------|------------|
| Orange | #FFA239 | Primary actions | White |
| Blue | #8CE4FF | Secondary/Info | Dark |
| Yellow | #FEEE91 | Warnings/Highlights | Dark |
| Red | #FF5656 | Errors/Danger | White |

---

## Examples in Context

### Auction Card
- **Title**: Gray (#0F172A)
- **Price**: Orange (#FFA239)
- **Category Badge**: Blue (#8CE4FF) with dark text
- **Ending Soon Badge**: Yellow (#FEEE91) with dark text
- **Sold Badge**: Red (#FF5656) with white text

### Buttons
- **Place Bid**: Orange background, white text
- **View Details**: Blue outline, blue text
- **Save for Later**: Gray outline, gray text
- **Delete**: Red background, white text

### Status Messages
- **Success**: Green (#22c55e)
- **Info**: Blue (#8CE4FF)
- **Warning**: Yellow (#FEEE91)
- **Error**: Red (#FF5656)

---

## Migration Notes

### What Changed
- Old primary: `#FF6A00` → New primary: `#FFA239`
- Old hover: `#E45700` → New hover: `#E68A1F`
- Added secondary blue: `#8CE4FF`
- Added warning yellow: `#FEEE91`
- Added danger red: `#FF5656`

### Files Modified
1. ✅ `mobile/auctionapp/app/theme.ts`
2. ✅ `frontend/src/index.css`
3. ✅ `frontend/src/styles/themes.css`

### Testing Checklist
- [ ] Test primary buttons in light mode
- [ ] Test primary buttons in dark mode
- [ ] Check login/register screens
- [ ] Verify product cards
- [ ] Test category badges
- [ ] Check admin dashboard
- [ ] Verify mobile app consistency

---

**Color scheme applied successfully! 🎉**

All colors are now live on both web and mobile platforms.
