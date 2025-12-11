#!/bin/bash

echo "========================================"
echo "Mobile App Theme Error Fix Script"
echo "========================================"
echo ""

echo "Step 1: Removing node_modules..."
if [ -d "node_modules" ]; then
    rm -rf node_modules
    echo "node_modules removed"
else
    echo "node_modules doesn't exist, skipping"
fi
echo ""

echo "Step 2: Removing package-lock.json..."
if [ -f "package-lock.json" ]; then
    rm package-lock.json
    echo "package-lock.json removed"
else
    echo "package-lock.json doesn't exist, skipping"
fi
echo ""

echo "Step 3: Removing .expo cache..."
if [ -d ".expo" ]; then
    rm -rf .expo
    echo ".expo removed"
else
    echo ".expo doesn't exist, skipping"
fi
echo ""

echo "Step 4: Installing dependencies..."
npm install --legacy-peer-deps
echo ""

echo "========================================"
echo "Fix completed!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Run: npm start"
echo "2. Scan QR code with Expo Go app"
echo "3. Test the app"
echo ""
