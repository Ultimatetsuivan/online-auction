@echo off
echo ========================================
echo Mobile App Theme Error Fix Script
echo ========================================
echo.

echo Step 1: Removing node_modules...
if exist node_modules (
    rmdir /s /q node_modules
    echo node_modules removed
) else (
    echo node_modules doesn't exist, skipping
)
echo.

echo Step 2: Removing package-lock.json...
if exist package-lock.json (
    del package-lock.json
    echo package-lock.json removed
) else (
    echo package-lock.json doesn't exist, skipping
)
echo.

echo Step 3: Removing .expo cache...
if exist .expo (
    rmdir /s /q .expo
    echo .expo removed
) else (
    echo .expo doesn't exist, skipping
)
echo.

echo Step 4: Installing dependencies...
call npm install --legacy-peer-deps
echo.

echo Step 5: Starting Expo with clear cache...
echo You can now run: npm start
echo or: npx expo start --clear
echo.

echo ========================================
echo Fix completed!
echo ========================================
echo.
echo Next steps:
echo 1. Run: npm start
echo 2. Scan QR code with Expo Go app
echo 3. Test the app
echo.
pause
