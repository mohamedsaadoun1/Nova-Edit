#!/bin/bash

# Clear all caches and reset project
echo "🧹 Clearing Nova Edit caches..."

# Remove node_modules
rm -rf node_modules

# Remove package-lock.json
rm -f package-lock.json

# Remove Metro cache
rm -rf .metro

# Remove Expo cache
rm -rf .expo

# Remove temp files
rm -rf tmp/
rm -rf .tmp/

# Clear npm cache
npm cache clean --force

echo "✅ All caches cleared!"
echo "💡 Run 'npm install' to reinstall dependencies"
