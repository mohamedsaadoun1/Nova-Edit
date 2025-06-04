#!/usr/bin/env node

/**
 * Script لتحسين أصول Nova Edit (الصور، الأصوات، الخطوط)
 * يحسن حجم الملفات ويرتبها للحصول على أفضل أداء
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Optimizing Nova Edit Assets...\n');

// مجلدات الأصول
const assetDirs = {
  images: 'assets/images',
  sounds: 'assets/sounds', 
  fonts: 'assets/fonts',
  models: 'assets/models'
};

// إنشاء مجلدات الأصول إذا لم تكن موجودة
console.log('📁 Creating asset directories...');
Object.entries(assetDirs).forEach(([type, dir]) => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`  ✅ Created ${dir}`);
  } else {
    console.log(`  ✅ ${dir} already exists`);
  }
});

// إنشاء ملفات تحسين الصور
console.log('\n🖼️  Setting up image optimization...');

// إنشاء bash script للصور
const webpScript = [
  '#!/bin/bash',
  '# Convert PNG/JPG images to WebP for better compression',
  '# Requires: cwebp (install with: apt-get install webp)',
  '',
  'echo "Converting images to WebP format..."',
  '',
  'for file in *.png *.jpg *.jpeg; do',
  '  if [ -f "$file" ]; then',
  '    filename="${file%.*}"',
  '    echo "Converting $file -> $filename.webp"',
  '    cwebp -q 80 "$file" -o "$filename.webp"',
  '  fi',
  'done',
  '',
  'echo "WebP conversion complete!"'
].join('\n');

try {
  fs.writeFileSync(path.join(process.cwd(), assetDirs.images, 'convert-to-webp.sh'), webpScript);
  fs.chmodSync(path.join(process.cwd(), assetDirs.images, 'convert-to-webp.sh'), '755');
  console.log('  ✅ WebP conversion script created');
} catch (error) {
  console.log('  ⚠️  Could not create WebP script:', error.message);
}

// إنشاء README للصور
const imagesReadme = `# صور Nova Edit المحلية

## التحسين:
- استخدم convert-to-webp.sh لتحويل الصور لـ WebP
- WebP يوفر ضغط أفضل بنسبة 25-35%
- احتفظ بالصور الأصلية كنسخة احتياطية

## الاستخدام:
\`\`\`bash
cd assets/images
chmod +x convert-to-webp.sh
./convert-to-webp.sh
\`\`\`

## صيغ مدعومة:
- PNG, JPG, JPEG → WebP
- SVG (بدون تحويل، محسن بالفعل)
- GIF (للأنيميشن فقط)
`;

try {
  fs.writeFileSync(path.join(process.cwd(), assetDirs.images, 'README.md'), imagesReadme);
  console.log('  ✅ Images README created');
} catch (error) {
  console.log('  ⚠️  Could not create images README:', error.message);
}

// إنشاء ملف تحسين الأصوات
console.log('\n🔊 Setting up audio optimization...');

const audioOptimizeScript = [
  '#!/bin/bash',
  '# Optimize audio files for mobile apps',
  '# Requires: ffmpeg',
  '',
  'echo "Optimizing audio files..."',
  '',
  'for file in *.wav *.aac *.m4a; do',
  '  if [ -f "$file" ]; then',
  '    filename="${file%.*}"',
  '    echo "Converting $file -> $filename.mp3"',
  '    ffmpeg -i "$file" -codec:a mp3 -b:a 128k "$filename.mp3"',
  '  fi',
  'done',
  '',
  'echo "Audio optimization complete!"'
].join('\n');

try {
  fs.writeFileSync(path.join(process.cwd(), assetDirs.sounds, 'optimize-audio.sh'), audioOptimizeScript);
  fs.chmodSync(path.join(process.cwd(), assetDirs.sounds, 'optimize-audio.sh'), '755');
  console.log('  ✅ Audio optimization script created');
} catch (error) {
  console.log('  ⚠️  Could not create audio script:', error.message);
}

// إنشاء README للأصوات
const soundsReadme = `# أصوات Nova Edit المحلية

## التحسين:
- استخدم optimize-audio.sh لضغط الأصوات
- تحويل جميع الصيغ إلى MP3 128kbps
- يقلل الحجم بنسبة 60-80%

## الاستخدام:
\`\`\`bash
cd assets/sounds
chmod +x optimize-audio.sh
./optimize-audio.sh
\`\`\`

## صيغ مدعومة:
- WAV, AAC, M4A → MP3 128kbps
- OGG (محسن بالفعل)
`;

try {
  fs.writeFileSync(path.join(process.cwd(), assetDirs.sounds, 'README.md'), soundsReadme);
  console.log('  ✅ Sounds README created');
} catch (error) {
  console.log('  ⚠️  Could not create sounds README:', error.message);
}

// إنشاء ملف إدارة الخطوط
console.log('\n📝 Setting up fonts optimization...');

const fontsReadme = `# خطوط Nova Edit المحلية

## الخطوط المتوفرة:
- Roboto (الافتراضي)
- Inter (حديث)
- Cairo (عربي)
- Amiri (عربي كلاسيكي)

## التحسين:
- استخدم صيغة WOFF2 للويب
- استخدم TTF للموبايل
- تم تحسين الخطوط العربية للشاشات الصغيرة

## الاستخدام:
\`\`\`javascript
import { useFonts } from 'expo-font';

const [fontsLoaded] = useFonts({
  'Cairo-Regular': require('./assets/fonts/Cairo-Regular.ttf'),
  'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
});
\`\`\`
`;

try {
  fs.writeFileSync(path.join(process.cwd(), assetDirs.fonts, 'README.md'), fontsReadme);
  console.log('  ✅ Fonts README created');
} catch (error) {
  console.log('  ⚠️  Could not create fonts README:', error.message);
}

// إنشاء ملف إدارة النماذج
console.log('\n🧠 Setting up AI models optimization...');

const modelsReadme = `# نماذج الذكاء الاصطناعي - Nova Edit

## النماذج المحلية:
- Body Segmentation (TensorFlow.js)
- Face Landmarks (MediaPipe)
- Speech to Text (Web Speech API)

## التحسين:
- النماذج محسنة للموبايل
- تحميل lazy للنماذج الكبيرة
- استخدام WebGL للتسريع

## الاستخدام:
\`\`\`javascript
import { loadModel } from '../services/AIProcessingService';

const model = await loadModel('bodySegmentation');
\`\`\`

## ملاحظات:
- النماذج تحمل عند الحاجة فقط
- استخدام cache لتجنب إعادة التحميل
- fallback للمعالجة CPU إذا لم يتوفر GPU
`;

try {
  fs.writeFileSync(path.join(process.cwd(), assetDirs.models, 'README.md'), modelsReadme);
  console.log('  ✅ Models README created');
} catch (error) {
  console.log('  ⚠️  Could not create models README:', error.message);
}

// إنشاء ملف master optimization
console.log('\n⚡ Creating master optimization script...');

const masterScript = [
  '#!/bin/bash',
  '# Master optimization script for Nova Edit assets',
  '',
  'echo "🚀 Starting Nova Edit asset optimization..."',
  '',
  '# Images',
  'echo "📸 Optimizing images..."',
  'cd assets/images && chmod +x convert-to-webp.sh && ./convert-to-webp.sh',
  'cd ../..',
  '',
  '# Audio',
  'echo "🔊 Optimizing audio..."',
  'cd assets/sounds && chmod +x optimize-audio.sh && ./optimize-audio.sh', 
  'cd ../..',
  '',
  '# Clean up',
  'echo "🧹 Cleaning up..."',
  'find . -name "*.DS_Store" -delete',
  'find . -name "Thumbs.db" -delete',
  '',
  'echo "✅ Optimization complete!"',
  '',
  '# Show sizes',
  'echo "📊 Asset sizes:"',
  'du -sh assets/*'
].join('\n');

try {
  fs.writeFileSync(path.join(process.cwd(), 'optimize-all-assets.sh'), masterScript);
  fs.chmodSync(path.join(process.cwd(), 'optimize-all-assets.sh'), '755');
  console.log('  ✅ Master optimization script created');
} catch (error) {
  console.log('  ⚠️  Could not create master script:', error.message);
}

// تقرير نهائي
console.log('\n📋 OPTIMIZATION SETUP COMPLETE!');
console.log('================================================');
console.log('✅ All asset directories created');
console.log('✅ Optimization scripts ready'); 
console.log('✅ Documentation files created');
console.log('');
console.log('🚀 To optimize all assets, run:');
console.log('   chmod +x optimize-all-assets.sh');
console.log('   ./optimize-all-assets.sh');
console.log('');
console.log('📱 For individual optimization:');
console.log('   Images: cd assets/images && ./convert-to-webp.sh');
console.log('   Audio: cd assets/sounds && ./optimize-audio.sh');
console.log('');
console.log('💡 This will significantly reduce your APK size!');