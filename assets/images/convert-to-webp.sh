#!/bin/bash
# Convert PNG/JPG images to WebP for better compression
# Requires: cwebp (install with: apt-get install webp)

echo "Converting images to WebP format..."

for file in *.png *.jpg *.jpeg; do
  if [ -f "$file" ]; then
    filename="${file%.*}"
    echo "Converting $file -> $filename.webp"
    cwebp -q 80 "$file" -o "$filename.webp"
  fi
done

echo "WebP conversion complete!"