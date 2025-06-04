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

// إنشاء .webp conversion script
const webpScript = '#!/bin/bash\n' +
'# Convert PNG/JPG images to WebP for better compression\n' +
'# Requires: cwebp (install with: apt-get install webp)\n' +
'\n' +
'echo "Converting images to WebP format..."\n' +
'\n' +
'for file in *.png *.jpg *.jpeg; do\n' +
'  if [ -f "$file" ]; then\n' +
'    filename="${file%.*}"\n' +
'    echo "Converting $file -> $filename.webp"\n' +
'    cwebp -q 80 "$file" -o "$filename.webp"\n' +
'  fi\n' +
'done\n' +
'\n' +
'echo "WebP conversion complete!"\n';

fs.writeFileSync(path.join(process.cwd(), assetDirs.images, 'convert-to-webp.sh'), webpScript);
fs.chmodSync(path.join(process.cwd(), assetDirs.images, 'convert-to-webp.sh'), '755');

// إنشاء ملف README للصور
const imagesReadme = `# صور Nova Edit المحلية

## التحسين:
- استخدم تنسيق WebP للصور (حجم أصغر بـ 25-50%)
- أقصى دقة موصى بها: 1920x1080 للصور الكاملة
- أقصى دقة موصى بها: 400x400 للصور المصغرة
- ضغط الجودة: 80% للتوازن بين الحجم والجودة

## الفئات:
- nature/     - صور الطبيعة
- business/   - صور الأعمال
- technology/ - صور التقنية
- people/     - صور الأشخاص

## أمثلة أسماء الملفات:
- nature_sunset_forest.webp
- business_modern_office.webp
- tech_laptop_coding.webp
- people_team_meeting.webp

Run ./convert-to-webp.sh to optimize existing images.
`;

fs.writeFileSync(path.join(process.cwd(), assetDirs.images, 'README.md'), imagesReadme);

// إنشاء ملف تحسين الأصوات
console.log('\n🔊 Setting up audio optimization...');

const audioOptimizeScript = `#!/bin/bash
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
`;

fs.writeFileSync(path.join(process.cwd(), assetDirs.sounds, 'optimize-audio.sh'), audioOptimizeScript);
fs.chmodSync(path.join(process.cwd(), assetDirs.sounds, 'optimize-audio.sh'), '755');

// إنشاء ملف README للأصوات
const soundsReadme = `# أصوات Nova Edit المحلية

## التحسين:
- استخدم تنسيق MP3 (128kbps للكلام، 192kbps للموسيقى)
- مدة قصيرة للمؤثرات: 0.5-3 ثواني
- مدة متوسطة للخلفيات: 10-30 ثانية
- تطبيع الصوت: -16 LUFS

## الفئات:
- notification/  - أصوات الإشعارات
- nature/        - أصوات الطبيعة
- technology/    - أصوات تقنية
- human/         - أصوات بشرية
- musical/       - المؤثرات الموسيقية

## أمثلة أسماء الملفات:
- notification_bell_clean.mp3
- nature_rain_light.mp3
- tech_keyboard_click.mp3
- human_applause_group.mp3

Run ./optimize-audio.sh to compress existing audio files.
`;

fs.writeFileSync(path.join(process.cwd(), assetDirs.sounds, 'README.md'), soundsReadme);

// إعداد الخطوط
console.log('\n📝 Setting up font optimization...');

// إنشاء ملف README للخطوط
const fontsReadme = `# خطوط Nova Edit المحلية

## التحسين:
- استخدم تنسيق TTF أو OTF
- ضغط الخطوط لإزالة الرموز غير المستخدمة
- تحسين الخطوط العربية للدعم الكامل

## الفئات:
- arabic/        - الخطوط العربية
- english/       - الخطوط الإنجليزية
- monospace/     - خطوط البرمجة
- display/       - خطوط العناوين

## أوزان الخطوط:
- Light (300)
- Regular (400)
- Medium (500)
- SemiBold (600)
- Bold (700)

## أمثلة أسماء الملفات:
- Cairo-Regular.ttf
- Roboto-Bold.ttf
- SourceCodePro-Medium.ttf

Font families should include at least Regular and Bold weights.
`;

fs.writeFileSync(path.join(process.cwd(), assetDirs.fonts, 'README.md'), fontsReadme);

// إنشاء مجلدات فرعية للخطوط
const fontSubdirs = ['arabic', 'english', 'monospace', 'display'];
fontSubdirs.forEach(subdir => {
  const subdirPath = path.join(process.cwd(), assetDirs.fonts, subdir);
  if (!fs.existsSync(subdirPath)) {
    fs.mkdirSync(subdirPath, { recursive: true });
    console.log(`  ✅ Created fonts/${subdir}`);
  }
});

// إعداد النماذج AI
console.log('\n🧠 Setting up AI models...');

const modelsReadme = `# نماذج الذكاء الاصطناعي المحلية

## النماذج المدعومة:
- face_detection.tflite     - كشف الوجوه
- selfie_segmentation.tflite - إزالة الخلفية
- pose_estimation.tflite    - تتبع الحركة
- hand_tracking.tflite      - تتبع اليدين

## التحسين:
- استخدم تنسيق TensorFlow Lite (.tflite)
- حجم النموذج المثالي: أقل من 10 MB
- دقة مقبولة: FP16 أو INT8 للسرعة

## المصادر:
- TensorFlow Hub
- MediaPipe Models
- TensorFlow Lite Models

Models should be downloaded and placed in this directory for offline functionality.
`;

fs.writeFileSync(path.join(process.cwd(), assetDirs.models, 'README.md'), modelsReadme);

// إنشاء script تحسين شامل
console.log('\n⚙️  Creating comprehensive optimization script...');

const comprehensiveOptimize = `#!/usr/bin/env node

/**
 * Comprehensive Nova Edit Asset Optimization
 * Run this after adding new assets to optimize everything
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting comprehensive asset optimization...');

// تحسين الصور
console.log('\\n🖼️  Optimizing images...');
try {
  process.chdir('assets/images');
  if (fs.existsSync('./convert-to-webp.sh')) {
    execSync('./convert-to-webp.sh', { stdio: 'inherit' });
  }
  process.chdir('../../');
} catch (error) {
  console.log('⚠️  Image optimization skipped (install cwebp for optimization)');
}

// تحسين الأصوات
console.log('\\n🔊 Optimizing audio...');
try {
  process.chdir('assets/sounds');
  if (fs.existsSync('./optimize-audio.sh')) {
    execSync('./optimize-audio.sh', { stdio: 'inherit' });
  }
  process.chdir('../../');
} catch (error) {
  console.log('⚠️  Audio optimization skipped (install ffmpeg for optimization)');
}

// تحسين حجم الملفات
console.log('\\n📊 Analyzing asset sizes...');
const assetDirs = ['assets/images', 'assets/sounds', 'assets/fonts', 'assets/models'];

assetDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    let totalSize = 0;
    let fileCount = 0;
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isFile()) {
        totalSize += fs.statSync(filePath).size;
        fileCount++;
      }
    });
    
    const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    console.log(\`  \${dir}: \${fileCount} files, \${sizeMB} MB\`);
  }
});

// إنشاء تقرير التحسين
const report = {
  timestamp: new Date().toISOString(),
  optimization: 'completed',
  recommendations: [
    'Use WebP format for images (25-50% smaller)',
    'Use MP3 format for audio (good compression)',
    'Include only essential fonts and weights',
    'Keep AI models under 10MB each'
  ]
};

fs.writeFileSync('assets/optimization-report.json', JSON.stringify(report, null, 2));
console.log('\\n✅ Optimization complete! Report saved to assets/optimization-report.json');
`;

fs.writeFileSync(path.join(process.cwd(), 'scripts/optimize-all-assets.js'), comprehensiveOptimize);
fs.chmodSync(path.join(process.cwd(), 'scripts/optimize-all-assets.js'), '755');

// إنشاء ملف .gitignore للأصول
console.log('\n📝 Creating assets .gitignore...');

const assetsGitignore = `# بعض الأصول قد تكون كبيرة - اختر ما تريد تضمينه في Git

# ملفات مؤقتة
*.tmp
*.temp
*.bak

# ملفات غير محسنة (احتفظ بالمحسنة فقط)
*.png.backup
*.jpg.backup
*.wav.backup

# ملفات النماذج الكبيرة (احتفظ بالمضغوطة فقط)
*.pb
*saved_model/

# ملفات التحليل
optimization-report.json

# ملفات المعاينة
preview/
thumbnails/

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
`;

fs.writeFileSync(path.join(process.cwd(), 'assets/.gitignore'), assetsGitignore);

// تقرير النتائج
console.log('\n' + '='.repeat(60));
console.log('📋 ASSET OPTIMIZATION SETUP COMPLETE');
console.log('='.repeat(60));

console.log('✅ Created asset directories:');
Object.values(assetDirs).forEach(dir => console.log(\`   📁 \${dir}\`));

console.log('\\n✅ Created optimization tools:');
console.log('   🖼️  Image WebP converter');
console.log('   🔊 Audio compression script');
console.log('   📝 Font organization structure');
console.log('   🧠 AI models directory');

console.log('\\n🚀 NEXT STEPS:');
console.log('   1. Add your images to assets/images/ and run ./convert-to-webp.sh');
console.log('   2. Add your audio files to assets/sounds/ and run ./optimize-audio.sh');
console.log('   3. Add your fonts to assets/fonts/ in appropriate subdirectories');
console.log('   4. Download AI models to assets/models/ (optional)');
console.log('   5. Run node scripts/optimize-all-assets.js for comprehensive optimization');

console.log('\\n💡 OPTIMIZATION TIPS:');
console.log('   • Keep total assets under 50MB for reasonable APK size');
console.log('   • Use WebP for images (better compression than PNG/JPG)');
console.log('   • Use MP3 for audio (good quality vs size balance)');
console.log('   • Include only essential font weights');
console.log('   • Compress AI models to TensorFlow Lite format');

console.log('\\n📱 The app will work completely offline once assets are added!');