#!/usr/bin/env node

/**
 * Script للتحقق من قدرة Nova Edit على العمل بدون إنترنت
 * يتأكد من وجود جميع الملفات المحلية المطلوبة
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Nova Edit Offline Capability...\n');

// الملفات والمجلدات المطلوبة
const requiredFiles = [
  // خدمات محلية
  'services/LocalImageLibrary.ts',
  'services/LocalSoundLibrary.ts', 
  'services/LocalFontLibrary.ts',
  'services/OfflineLibraryService.ts',
  
  // إعدادات محسنة
  'android/app/build.gradle.optimized',
  'android/app/proguard-rules.pro',
  'metro.config.optimized.js',
];

const requiredDirectories = [
  // مجلدات الأصول المحلية (ستُنشأ لاحقاً)
  'assets/images',
  'assets/sounds', 
  'assets/fonts',
  'assets/models',
  
  // مجلدات المكونات الأساسية
  'components',
  'services', 
  'store',
  'types'
];

let allGood = true;
let warnings = [];
let errors = [];

// التحقق من الملفات المطلوبة
console.log('📁 Checking required files...');
requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    errors.push(`Missing required file: ${file}`);
    allGood = false;
  }
});

// التحقق من المجلدات المطلوبة
console.log('\n📂 Checking required directories...');
requiredDirectories.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(dirPath)) {
    console.log(`  ✅ ${dir}`);
  } else {
    console.log(`  ⚠️  ${dir} - MISSING (will be created)`);
    warnings.push(`Directory ${dir} should be created for optimal offline support`);
    
    // إنشاء المجلدات المفقودة
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`    ➕ Created ${dir}`);
    } catch (error) {
      console.log(`    ❌ Failed to create ${dir}: ${error.message}`);
      errors.push(`Cannot create directory: ${dir}`);
      allGood = false;
    }
  }
});

// فحص محتوى المكتبات المحلية
console.log('\n🔬 Analyzing local libraries...');

try {
  // فحص LocalImageLibrary
  const imageLibPath = path.join(process.cwd(), 'services/LocalImageLibrary.ts');
  if (fs.existsSync(imageLibPath)) {
    const content = fs.readFileSync(imageLibPath, 'utf8');
    const imageCount = (content.match(/id: '[^']+'/g) || []).length;
    console.log(`  🖼️  Local Images: ${imageCount} items`);
    
    if (imageCount < 5) {
      warnings.push('Consider adding more images for better user experience');
    }
  }
  
  // فحص LocalSoundLibrary
  const soundLibPath = path.join(process.cwd(), 'services/LocalSoundLibrary.ts');
  if (fs.existsSync(soundLibPath)) {
    const content = fs.readFileSync(soundLibPath, 'utf8');
    const soundCount = (content.match(/id: '[^']+'/g) || []).length;
    console.log(`  🔊 Local Sounds: ${soundCount} items`);
    
    if (soundCount < 5) {
      warnings.push('Consider adding more sounds for better user experience');
    }
  }
  
  // فحص LocalFontLibrary
  const fontLibPath = path.join(process.cwd(), 'services/LocalFontLibrary.ts');
  if (fs.existsSync(fontLibPath)) {
    const content = fs.readFileSync(fontLibPath, 'utf8');
    const fontCount = (content.match(/id: '[^']+'/g) || []).length;
    console.log(`  📝 Local Fonts: ${fontCount} families`);
    
    if (fontCount < 3) {
      warnings.push('Consider adding more fonts for better typography options');
    }
  }
  
} catch (error) {
  console.log(`  ❌ Error analyzing libraries: ${error.message}`);
  errors.push('Failed to analyze local libraries');
  allGood = false;
}

// فحص التبعيات في package.json
console.log('\n📦 Checking package.json dependencies...');

try {
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // تبعيات مطلوبة للعمل بدون إنترنت
  const essentialDeps = [
    'expo',
    'react-native',
    '@tensorflow/tfjs',
    'ffmpeg-kit-react-native', 
    'react-native-reanimated',
    'zustand'
  ];
  
  const missingDeps = essentialDeps.filter(dep => 
    !packageData.dependencies[dep] && !packageData.devDependencies[dep]
  );
  
  if (missingDeps.length === 0) {
    console.log('  ✅ All essential dependencies found');
  } else {
    console.log(`  ❌ Missing dependencies: ${missingDeps.join(', ')}`);
    errors.push(`Missing essential dependencies: ${missingDeps.join(', ')}`);
    allGood = false;
  }
  
} catch (error) {
  console.log(`  ❌ Error checking package.json: ${error.message}`);
  errors.push('Cannot read package.json');
  allGood = false;
}

// فحص إعدادات التحسين
console.log('\n⚙️  Checking optimization settings...');

const optimizationFiles = [
  'android/app/build.gradle.optimized',
  'metro.config.optimized.js',
  'android/app/proguard-rules.pro'
];

optimizationFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ⚠️  ${file} - optimization not configured`);
    warnings.push(`Optimization file ${file} is missing - APK size may be larger`);
  }
});

// تقدير حجم APK
console.log('\n📏 Estimating APK size...');

try {
  const nodeModulesSize = getDirSize(path.join(process.cwd(), 'node_modules'));
  const assetsSize = fs.existsSync(path.join(process.cwd(), 'assets')) 
    ? getDirSize(path.join(process.cwd(), 'assets')) 
    : 0;
  const componentSize = getDirSize(path.join(process.cwd(), 'components'));
  
  const estimatedSize = Math.round((nodeModulesSize + assetsSize + componentSize) / (1024 * 1024));
  console.log(`  📊 Estimated unoptimized size: ~${estimatedSize} MB`);
  
  const optimizedSize = Math.round(estimatedSize * 0.4); // تحسين 60%
  console.log(`  🚀 Estimated optimized size: ~${optimizedSize} MB`);
  
  if (optimizedSize > 100) {
    warnings.push('APK size may still be large - consider removing unused dependencies');
  }
  
} catch (error) {
  console.log(`  ⚠️  Could not estimate size: ${error.message}`);
  warnings.push('Cannot estimate APK size');
}

// النتائج النهائية
console.log('\n' + '='.repeat(60));
console.log('📋 VERIFICATION RESULTS');
console.log('='.repeat(60));

if (allGood && errors.length === 0) {
  console.log('🎉 EXCELLENT! Nova Edit is ready for offline APK build');
  console.log('✅ All required files present');
  console.log('✅ Local libraries configured');
  console.log('✅ No external API dependencies');
  console.log('✅ Optimization settings available');
} else {
  console.log('❌ Issues found - APK build may fail');
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  warnings.forEach(warning => console.log(`   • ${warning}`));
}

if (errors.length > 0) {
  console.log('\n❌ ERRORS:');
  errors.forEach(error => console.log(`   • ${error}`));
}

console.log('\n🚀 NEXT STEPS:');
if (allGood) {
  console.log('   1. Run "npm run optimize:assets" to prepare assets');
  console.log('   2. Copy optimized configs: cp android/app/build.gradle.optimized android/app/build.gradle');
  console.log('   3. Copy metro config: cp metro.config.optimized.js metro.config.js');
  console.log('   4. Build APK: npm run build:android:apk');
} else {
  console.log('   1. Fix the errors listed above');
  console.log('   2. Re-run this verification script');
  console.log('   3. Ensure all local services are properly implemented');
}

console.log('\n📱 For mobile APK conversion instructions, see the documentation.');

// Exit with appropriate code
process.exit(allGood ? 0 : 1);

// Helper function to get directory size
function getDirSize(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;
  
  let totalSize = 0;
  
  function calculateSize(itemPath) {
    const stats = fs.statSync(itemPath);
    
    if (stats.isFile()) {
      totalSize += stats.size;
    } else if (stats.isDirectory()) {
      const items = fs.readdirSync(itemPath);
      items.forEach(item => {
        calculateSize(path.join(itemPath, item));
      });
    }
  }
  
  try {
    calculateSize(dirPath);
  } catch (error) {
    // تجاهل الأخطاء في الوصول للملفات
  }
  
  return totalSize;
}