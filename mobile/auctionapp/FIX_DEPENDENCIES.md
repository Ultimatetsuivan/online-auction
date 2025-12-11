# Fix NPM Dependencies Error

## Problem
`expo-auth-session@~6.0.4` version doesn't exist for Expo SDK 54.

## Solution Applied
Updated `expo-auth-session` from `~6.0.4` to `~7.0.0` in package.json (line 19)

## Steps to Fix

### 1. Clean the project (in mobile/auctionapp directory)

```bash
cd C:\Users\bukhbtu01\Downloads\onlineauction-clean\mobile\auctionapp

# Delete node_modules and package-lock.json
rmdir /s /q node_modules
del package-lock.json

# Or on Mac/Linux:
# rm -rf node_modules package-lock.json
```

### 2. Clear npm cache (optional but recommended)

```bash
npm cache clean --force
```

### 3. Install dependencies

```bash
npm install
```

### 4. If still getting errors, try:

```bash
npm install --legacy-peer-deps
```

## Alternative: Use Expo CLI

Since this is an Expo project, you can also use:

```bash
# Install Expo CLI globally if not installed
npm install -g expo-cli

# Clean install
expo install

# Or install specific packages
expo install expo-auth-session
```

## Verify Installation

After installation, verify the version:

```bash
npm list expo-auth-session
```

Expected output:
```
auctionapp@1.0.0
└── expo-auth-session@7.0.x
```

## If Problem Persists

Try installing a specific compatible version:

```bash
npm install expo-auth-session@7.0.2
```

## Expo SDK 54 Compatible Versions

For reference, these are the compatible package versions for Expo SDK 54:

- expo: ~54.0.0
- expo-auth-session: ~7.0.0
- expo-constants: ~18.0.0
- expo-font: ~14.0.0
- expo-linking: ~8.0.0
- expo-router: ~6.0.0
- expo-splash-screen: ~31.0.0
- expo-status-bar: ~3.0.0

## Start the App

After successful installation:

```bash
npm start
# or
expo start
```
