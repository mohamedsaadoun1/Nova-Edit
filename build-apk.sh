#!/bin/bash

# Nova Edit APK Build Script
echo "🚀 Building Nova Edit APK..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Android SDK is configured
if [ ! -f "android/local.properties" ]; then
    print_error "Android SDK not configured. Please edit android/local.properties"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Clean previous builds
print_status "Cleaning previous builds..."
cd android
./gradlew clean
cd ..

# Install dependencies
print_status "Installing dependencies..."
npm install

# Optimize assets if script exists
if [ -f "optimize-all-assets.sh" ]; then
    print_status "Optimizing assets..."
    chmod +x optimize-all-assets.sh
    ./optimize-all-assets.sh
fi

# Build APK
print_status "Building release APK..."
cd android
./gradlew assembleRelease

if [ $? -eq 0 ]; then
    print_status "APK built successfully!"
    
    # Find and display APK location
    APK_PATH=$(find app/build/outputs/apk/release -name "*.apk" | head -1)
    if [ -n "$APK_PATH" ]; then
        APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
        print_status "APK location: $APK_PATH"
        print_status "APK size: $APK_SIZE"
        
        # Copy to root for easy access
        cp "$APK_PATH" "../nova-edit-release.apk"
        print_status "APK copied to: nova-edit-release.apk"
    fi
else
    print_error "APK build failed!"
    exit 1
fi

cd ..
print_status "Build completed successfully!"
