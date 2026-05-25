# Component Update Examples - How to Use Translations

This guide shows you how to update your components to use the translation system.

## Web Frontend Examples

### Example 1: Home Component (frontend/src/screen/home/Home.jsx)

**Before:**
```jsx
<h3>Recommended for you</h3>
```

**After:**
```jsx
const { t } = useLanguage();

<h3>{t('recommendedForYou')}</h3>
```

**Full Example:**
```jsx
import { useLanguage } from '../../context/LanguageContext';

export const Home = () => {
  const { t } = useLanguage(); // Add this hook

  // ... rest of component

  return (
    <div className="home-auction">
      {/* Replace all hardcoded English text with t('keyName') */}
      <h5>{t('categories')}</h5>
      <button onClick={() => setSelectedCategory("all")}>
        {t('allCategories')}
      </button>

      <h3>{t('recommendedForYou')}</h3>
      <Link to="/allproduct">{t('viewAll')}</Link>

      <button className="home-button secondary" onClick={onOpen}>
        {t('details')}
      </button>
      <button className="home-button" onClick={onOpen}>
        {t('bidNow')}
      </button>
    </div>
  );
};
```

### Example 2: Product Detail Component

**Before:**
```jsx
<button>Place Bid</button>
<button>Buy Now</button>
```

**After:**
```jsx
const { t } = useLanguage();

<button>{t('placeBid')}</button>
<button>{t('buyNow')}</button>
```

### Example 3: Forms with Error Messages

**Before:**
```jsx
{errors.email && <div className="error">Please enter a valid email</div>}
```

**After:**
```jsx
const { t } = useLanguage();

{errors.email && <div className="error">{t('invalidEmail')}</div>}
```

### Example 4: Conditional Text

**Before:**
```jsx
const statusText = product.sold ? 'Sold' : 'Available';
```

**After:**
```jsx
const { t } = useLanguage();

const statusText = product.sold ? t('sold') : t('available');
```

### Example 5: Dynamic Time Text

**Before:**
```jsx
if (diffMins < 1) return 'Just now';
if (diffMins < 60) return `${diffMins} min ago`;
```

**After:**
```jsx
const { t, language } = useLanguage();

if (diffMins < 1) return t('justNow');
if (diffMins < 60) return `${diffMins} ${t('minutesShort')} ${t('ago')}`;
```

---

## Mobile App Examples

### Example 1: Home Screen (mobile/auctionapp/app/(tabs)/index.tsx)

**Before:**
```tsx
<Text style={styles.title}>Featured Products</Text>
```

**After:**
```tsx
import { t } from '@/src/i18n/translations';

<Text style={styles.title}>{t('featured')}</Text>
```

### Example 2: Product Card Component

**Before:**
```tsx
<TouchableOpacity style={styles.button}>
  <Text>Bid Now</Text>
</TouchableOpacity>
```

**After:**
```tsx
import { t } from '@/src/i18n/translations';

<TouchableOpacity style={styles.button}>
  <Text>{t('bidNow')}</Text>
</TouchableOpacity>
```

### Example 3: Login Screen

**Before:**
```tsx
<TextInput placeholder="Email or Phone" />
<Button title="Login" onPress={handleLogin} />
```

**After:**
```tsx
import { t } from '@/src/i18n/translations';

<TextInput placeholder={t('emailOrPhone')} />
<Button title={t('login')} onPress={handleLogin} />
```

### Example 4: With Variables

**Before:**
```tsx
<Text>Found 25 products</Text>
```

**After:**
```tsx
import { tv } from '@/src/i18n/translations';

// In translations.ts, add: resultsFound: 'Found {{count}} products'
<Text>{tv('resultsFound', { count: 25 })}</Text>
```

### Example 5: Language Toggle Button

```tsx
import { toggleLanguage, getLanguage } from '@/src/i18n/translations';

function LanguageToggle() {
  const [lang, setLang] = useState(getLanguage());

  const handleToggle = () => {
    toggleLanguage();
    setLang(getLanguage());
  };

  return (
    <TouchableOpacity onPress={handleToggle}>
      <Text>{lang === 'EN' ? 'Switch to Mongolian' : 'Switch to English'}</Text>
    </TouchableOpacity>
  );
}
```

---

## Step-by-Step Process

### For Each Component:

1. **Import the translation hook**
   ```jsx
   // Web
   import { useLanguage } from '../../context/LanguageContext';

   // Mobile
   import { t } from '@/src/i18n/translations';
   ```

2. **Use the hook (Web only)**
   ```jsx
   const { t } = useLanguage();
   ```

3. **Replace all hardcoded English text**
   - Find all English strings in the component
   - Replace them with `t('keyName')`
   - Make sure the key exists in your translations file

4. **Test**
   - Switch language and verify all text changes
   - Check that no English text remains

---

## Common Patterns

### Buttons
```jsx
// Before
<button>Save</button>
<button>Cancel</button>

// After
<button>{t('save')}</button>
<button>{t('cancel')}</button>
```

### Form Labels
```jsx
// Before
<label>Email Address</label>

// After
<label>{t('email')}</label>
```

### Placeholders
```jsx
// Before
<input placeholder="Search for anything..." />

// After
<input placeholder={t('searchPlaceholder')} />
```

### Conditional Rendering
```jsx
// Before
{loading ? 'Loading...' : 'Submit'}

// After
{loading ? t('loading') : t('submit')}
```

### Lists/Arrays
```jsx
// Before
const conditions = ['New', 'Like New', 'Used', 'Refurbished'];

// After
const conditions = [
  { value: 'new', label: t('new') },
  { value: 'likeNew', label: t('likeNew') },
  { value: 'used', label: t('used') },
  { value: 'refurbished', label: t('refurbished') },
];
```

---

## Pro Tips

1. **Group related translations** in the translations file for easier management

2. **Use consistent naming**:
   - `buttonSave` instead of `saveBtn`
   - `errorInvalidEmail` instead of `emailError`

3. **Don't translate**:
   - API endpoints
   - Technical error codes
   - Database field names
   - Route paths

4. **Do translate**:
   - All user-facing text
   - Button labels
   - Form labels and placeholders
   - Error and success messages
   - Navigation items

5. **Test edge cases**:
   - Long Mongolian words might break layouts
   - Test on mobile screens
   - Check all text fits in buttons

---

## Quick Reference

### Web (React)
```jsx
import { useLanguage } from '@/context/LanguageContext';

function MyComponent() {
  const { t, language, toggleLanguage } = useLanguage();

  return <button onClick={toggleLanguage}>{t('myKey')}</button>;
}
```

### Mobile (React Native)
```tsx
import { t, setLanguage, getLanguage } from '@/src/i18n/translations';

function MyScreen() {
  return <Text>{t('myKey')}</Text>;
}
```

---

Need help updating a specific component? Just ask!
