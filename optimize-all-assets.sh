#!/bin/bash
# Master optimization script for Nova Edit assets

echo "🚀 Starting Nova Edit asset optimization..."

# Images
echo "📸 Optimizing images..."
cd assets/images && chmod +x convert-to-webp.sh && ./convert-to-webp.sh
cd ../..

# Audio
echo "🔊 Optimizing audio..."
cd assets/sounds && chmod +x optimize-audio.sh && ./optimize-audio.sh
cd ../..

# Clean up
echo "🧹 Cleaning up..."
find . -name "*.DS_Store" -delete
find . -name "Thumbs.db" -delete

echo "✅ Optimization complete!"

# Show sizes
echo "📊 Asset sizes:"
du -sh assets/*