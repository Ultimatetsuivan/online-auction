# Mobile App Theme Error Fix Guide

## Issues Fixed

1. ✅ Removed conflicting `react-navigation` v5 dependency (conflicts with v7)
2. ✅ Removed ErrorBoundary import (component doesn't exist)
3. ✅ Fixed ThemeProvider initialization order
4. ✅ Improved error messages in useTheme hook
5. ✅ Fixed state initialization in ThemeContext

## What Was Changed

### 1. `package.json`
- **Removed:** `"react-navigation": "^5.0.0"` (line 46)
- This was causing property configuration conflicts with the newer @react-navigation packages

### 2. `app/_layout.tsx`
- **Removed:** ErrorBoundary wrapper (component doesn't exist)
- **Removed:** `useAuth` import and usage (simplify loading logic)
- **Fixed:** Use static theme color during initial load instead of themeColors
- **Added:** Proper React import

### 3. `src/contexts/ThemeContext.tsx`
- **Improved:** State initialization order
- **Enhanced:** Error message in useTheme hook
- **Added:** Explicit return type for useTheme

## Steps to Fix Your App

### Step 1: Clean Installation

```bash
cd mobile/auctionapp

# Delete node_modules and lock file
rm -rf node_modules
rm package-lock.json  # or rm -rf yarn.lock if using yarn

# Reinstall dependencies
npm install

# If you get peer dependency warnings, use:
npm install --legacy-peer-deps
```

### Step 2: Clear Metro Bundler Cache

```bash
# Clear Expo cache
npx expo start --clear
```

### Step 3: Restart the App

```bash
# Start with tunnel (recommended for testing on physical device)
npm start

# OR start normally
npx expo start

# Scan the QR code with Expo Go app
```

## Verification Steps

After starting the app, verify:

1. ✅ App loads without crashing
2. ✅ No "property is not configurable" error
3. ✅ No "property themeColors doesn't exist" error
4. ✅ No "useTheme must be used within a ThemeProvider" error
5. ✅ Theme colors work correctly (light/dark mode)
6. ✅ Navigation works (tabs, screens)

## If You Still Get Errors

### Error: "useTheme must be used within a ThemeProvider"

**Cause:** A component is using `useTheme()` outside of the ThemeProvider

**Solution:** Check if any component imported at the top level is using useTheme

**Check these files:**
```bash
# Search for useTheme usage
grep -r "useTheme" app/
grep -r "useTheme" src/
```

**Make sure useTheme is only called inside components rendered within ThemeProvider**

---

### Error: "property is not configurable"

**Cause:** Conflicting dependencies or cached modules

**Solution:**
```bash
# Complete clean
rm -rf node_modules
rm package-lock.json
rm -rf .expo
npm install --legacy-peer-deps
npx expo start --clear
```

---

### Error: Module not found

**Cause:** Missing dependencies after package.json changes

**Solution:**
```bash
npm install @react-native-async-storage/async-storage
npm install expo-router
npm install @react-navigation/native
```

---

## Understanding the Theme System

### Theme Structure

```typescript
// app/theme.ts exports:
1. Default export: theme object with all colors
2. Named export: themes (marketplace, car)
3. Named export: ThemeType

// src/contexts/ThemeContext.tsx provides:
- ThemeProvider component
- useTheme hook
- Returns: isDarkMode, themeMode, themeColors, isLoading, setThemeMode
```

### Using Theme in Components

```typescript
import { useTheme } from "../../src/contexts/ThemeContext";
import theme from "../theme";

function MyComponent() {
  const { isDarkMode, themeColors } = useTheme();

  return (
    <View style={{ backgroundColor: themeColors.background }}>
      <Text style={{ color: themeColors.text }}>Hello</Text>
      <View style={{ borderColor: theme.brand600 }}>
        {/* Use theme for brand colors */}
      </View>
    </View>
  );
}
```

### When to Use What

**Use `themeColors` from useTheme():**
- Background colors
- Text colors
- Border colors
- Surface colors
- Colors that change with light/dark mode

**Use `theme` direct import:**
- Brand colors (orange)
- Fixed colors that don't change with theme
- Gradients
- Status colors (success, warning, danger)

---

## Common Mistakes to Avoid

### ❌ DON'T: Use useTheme at top level
```typescript
// This will cause error
const { themeColors } = useTheme();

function App() {
  return <ThemeProvider>...</ThemeProvider>
}
```

### ✅ DO: Use useTheme inside provider
```typescript
function App() {
  return (
    <ThemeProvider>
      <MyComponent /> {/* useTheme works here */}
    </ThemeProvider>
  );
}

function MyComponent() {
  const { themeColors } = useTheme(); // ✅ Works!
  return <View />;
}
```

---

### ❌ DON'T: Access themeColors during loading
```typescript
function App() {
  const { themeColors, isLoading } = useTheme();

  if (isLoading) {
    // ❌ themeColors might not be ready
    return <View style={{ backgroundColor: themeColors.background }} />;
  }
}
```

### ✅ DO: Use static theme during loading
```typescript
import theme from "./theme";

function App() {
  const { themeColors, isLoading } = useTheme();

  if (isLoading) {
    // ✅ Use static theme
    return <View style={{ backgroundColor: theme.gray50 }} />;
  }

  // ✅ Use themeColors after loading
  return <View style={{ backgroundColor: themeColors.background }} />;
}
```

---

## Testing Theme

### Test Light/Dark Mode

```typescript
import { useTheme } from "../../src/contexts/ThemeContext";

function SettingsScreen() {
  const { themeMode, setThemeMode, isDarkMode } = useTheme();

  return (
    <View>
      <Button
        title="Light Mode"
        onPress={() => setThemeMode('light')}
      />
      <Button
        title="Dark Mode"
        onPress={() => setThemeMode('dark')}
      />
      <Button
        title="System"
        onPress={() => setThemeMode('system')}
      />
      <Text>Current: {isDarkMode ? 'Dark' : 'Light'}</Text>
    </View>
  );
}
```

---

## Additional Resources

- React Context API: https://react.dev/reference/react/useContext
- Expo Router: https://docs.expo.dev/router/introduction/
- React Navigation: https://reactnavigation.org/

---

## Need More Help?

If you still encounter errors after following this guide:

1. Check the console output for specific error messages
2. Verify all imports are correct
3. Ensure ThemeProvider wraps your entire app
4. Clear all caches and reinstall
5. Check if any third-party library is modifying global objects

**Debug Command:**
```bash
# Run with verbose logging
EXPO_DEBUG=true npx expo start --clear
```
