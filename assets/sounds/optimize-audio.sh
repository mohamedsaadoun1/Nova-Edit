#!/bin/bash
# Optimize audio files for mobile apps
# Requires: ffmpeg

echo "Optimizing audio files..."

for file in *.wav *.aac *.m4a; do
  if [ -f "$file" ]; then
    filename="${file%.*}"
    echo "Converting $file -> $filename.mp3"
    ffmpeg -i "$file" -codec:a mp3 -b:a 128k "$filename.mp3"
  fi
done

echo "Audio optimization complete!"