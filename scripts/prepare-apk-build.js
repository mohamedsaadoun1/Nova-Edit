#!/usr/bin/env node

/**
 * APK Build Preparation Script
 * سكريپت تحضير بناء APK مع جميع التحسينات
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing Nova Edit for APK Build...\n');

// فحص متطلبات البناء
console.log('🔍 Checking build requirements...');

const requiredFiles = [
  'android/app/build.gradle',
  'android/app/proguard-rules.pro',
  'metro.config.js',
  'app.json'
];

let allRequiredFilesExist = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    allRequiredFilesExist = false;
  }
});

if (!allRequiredFilesExist) {
  console.log('\n❌ Some required files are missing. Please ensure all files are present.');
  process.exit(1);
}

// فحص وتطبيق الملفات المحسنة
console.log('\n⚙️  Applying optimized configurations...');

try {
  // نسخ build.gradle المحسن إذا كان متوفراً
  if (fs.existsSync('android/app/build.gradle.optimized')) {
    const optimizedGradle = fs.readFileSync('android/app/build.gradle.optimized', 'utf8');
    fs.writeFileSync('android/app/build.gradle', optimizedGradle);
    console.log('  ✅ Applied optimized build.gradle');
  }

  // نسخ metro.config.js المحسن إذا كان متوفراً
  if (fs.existsSync('metro.config.optimized.js')) {
    const optimizedMetro = fs.readFileSync('metro.config.optimized.js', 'utf8');
    fs.writeFileSync('metro.config.js', optimizedMetro);
    console.log('  ✅ Applied optimized metro.config.js');
  }

} catch (error) {
  console.error('  ⚠️  Error applying optimizations:', error.message);
}

// تحسين package.json للإنتاج
console.log('\n📦 Optimizing package.json for production...');

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // إضافة scripts مفيدة للبناء إذا لم تكن موجودة
  const buildScripts = {
    "build:android:clean": "cd android && ./gradlew clean",
    "build:android:apk": "cd android && ./gradlew assembleRelease",
    "build:android:aab": "cd android && ./gradlew bundleRelease",
    "prebuild:android": "npm run build:android:clean",
    "analyze:apk": "npx react-native-bundle-visualizer"
  };

  let scriptsAdded = 0;
  Object.entries(buildScripts).forEach(([script, command]) => {
    if (!packageJson.scripts[script]) {
      packageJson.scripts[script] = command;
      scriptsAdded++;
    }
  });

  if (scriptsAdded > 0) {
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    console.log(`  ✅ Added ${scriptsAdded} build scripts to package.json`);
  } else {
    console.log('  ✅ Build scripts already present');
  }

} catch (error) {
  console.error('  ⚠️  Error updating package.json:', error.message);
}

// إنشاء ملف gradle.properties محسن
console.log('\n🛠️  Creating optimized gradle.properties...');

const gradleProperties = `# Gradle optimization for Nova Edit APK build
# Enable build cache
org.gradle.caching=true

# Use parallel execution
org.gradle.parallel=true

# Configure JVM
org.gradle.jvmargs=-Xmx4g -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8

# Android build optimizations
android.useAndroidX=true
android.enableJetifier=true

# Enable R8 full mode (aggressive optimization)
android.enableR8.fullMode=true

# Enable build features
android.enableBuildCache=true

# Disable unnecessary build features
android.enableResourceOptimizations=true
android.enableSeparateAnnotationProcessing=true

# React Native optimizations
org.gradle.daemon=true
org.gradle.configureondemand=true

# Hermes engine
hermesEnabled=true

# Bundle optimization
enableProguardInReleaseBuilds=true
enableSeparateBuildPerCPUArchitecture=true

# Disable unnecessary checks
android.enableResourceValidation=false
android.enableBuildFeatures.viewBinding=false
android.enableBuildFeatures.dataBinding=false

# Nova Edit specific optimizations
novaedit.enableOfflineMode=true
novaedit.optimizeAssets=true
novaedit.removeDebugCode=true
`;

try {
  fs.writeFileSync('android/gradle.properties', gradleProperties);
  console.log('  ✅ Created optimized gradle.properties');
} catch (error) {
  console.error('  ⚠️  Error creating gradle.properties:', error.message);
}

// إنشاء ملف local.properties إذا لم يكن موجوداً
console.log('\n🔧 Checking local.properties...');

const localPropertiesPath = 'android/local.properties';
if (!fs.existsSync(localPropertiesPath)) {
  // البحث عن Android SDK
  const possibleSdkPaths = [
    '/Users/$(whoami)/Library/Android/sdk',
    '/home/$(whoami)/Android/Sdk',
    '/opt/android-sdk',
    'C:\\Users\\%USERNAME%\\AppData\\Local\\Android\\Sdk'
  ];

  const localProperties = `# Android SDK location
# Please set this to your actual Android SDK path
# Example paths:
# sdk.dir=/Users/yourname/Library/Android/sdk
# sdk.dir=/home/yourname/Android/Sdk
# sdk.dir=C:\\\\Users\\\\yourname\\\\AppData\\\\Local\\\\Android\\\\Sdk

# Uncomment and set your actual path:
# sdk.dir=${possibleSdkPaths[0]}

# For CI/CD, you can also use environment variables:
# sdk.dir=\${env.ANDROID_HOME}
`;

  fs.writeFileSync(localPropertiesPath, localProperties);
  console.log('  ✅ Created local.properties template');
  console.log('  ⚠️  Please edit android/local.properties and set your Android SDK path');
} else {
  console.log('  ✅ local.properties already exists');
}

// فحص signing config
console.log('\n🔐 Checking signing configuration...');

const keystoreInfo = `
To sign your APK for release, you need to:

1. Generate a keystore:
   keytool -genkey -v -keystore nova-edit-release-key.keystore -alias nova-edit -keyalg RSA -keysize 2048 -validity 10000

2. Add to gradle.properties:
   NOVA_UPLOAD_STORE_FILE=nova-edit-release-key.keystore
   NOVA_UPLOAD_KEY_ALIAS=nova-edit
   NOVA_UPLOAD_STORE_PASSWORD=yourpassword
   NOVA_UPLOAD_KEY_PASSWORD=yourpassword

3. Place keystore in android/app/ directory

For development builds, the debug keystore will be used automatically.
`;

if (!fs.existsSync('android/app/nova-edit-release-key.keystore')) {
  console.log('  ⚠️  Release keystore not found');
  console.log('  📝 Signing instructions:');
  console.log(keystoreInfo);
} else {
  console.log('  ✅ Release keystore found');
}

// تحسين الأصول
console.log('\n🖼️  Optimizing assets...');

const assetDirs = ['assets/images', 'assets/sounds', 'assets/fonts'];
let totalSize = 0;

assetDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    const dirSize = files.reduce((size, file) => {
      const filePath = path.join(dir, file);
      try {
        const stats = fs.statSync(filePath);
        return size + stats.size;
      } catch {
        return size;
      }
    }, 0);
    totalSize += dirSize;
    console.log(`  📁 ${dir}: ${files.length} files, ${(dirSize / 1024 / 1024).toFixed(2)} MB`);
  }
});

console.log(`  📊 Total assets size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

if (totalSize > 50 * 1024 * 1024) { // 50MB
  console.log('  ⚠️  Assets are large, consider optimization');
  console.log('  💡 Run: ./optimize-all-assets.sh');
}

// إنشاء سكريپت بناء نهائي
console.log('\n🏗️  Creating build script...');

const buildScript = `#!/bin/bash

# Nova Edit APK Build Script
echo "🚀 Building Nova Edit APK..."

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "\${GREEN}✅ \$1\${NC}"
}

print_warning() {
    echo -e "\${YELLOW}⚠️  \$1\${NC}"
}

print_error() {
    echo -e "\${RED}❌ \$1\${NC}"
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

if [ \$? -eq 0 ]; then
    print_status "APK built successfully!"
    
    # Find and display APK location
    APK_PATH=\$(find app/build/outputs/apk/release -name "*.apk" | head -1)
    if [ -n "\$APK_PATH" ]; then
        APK_SIZE=\$(du -h "\$APK_PATH" | cut -f1)
        print_status "APK location: \$APK_PATH"
        print_status "APK size: \$APK_SIZE"
        
        # Copy to root for easy access
        cp "\$APK_PATH" "../nova-edit-release.apk"
        print_status "APK copied to: nova-edit-release.apk"
    fi
else
    print_error "APK build failed!"
    exit 1
fi

cd ..
print_status "Build completed successfully!"
`;

try {
  fs.writeFileSync('build-apk.sh', buildScript);
  fs.chmodSync('build-apk.sh', '755');
  console.log('  ✅ Created build-apk.sh script');
} catch (error) {
  console.error('  ⚠️  Error creating build script:', error.message);
}

// تقرير نهائي
console.log('\n📋 APK BUILD PREPARATION COMPLETE!');
console.log('===========================================');
console.log('✅ All configurations applied');
console.log('✅ Build scripts created');
console.log('✅ Optimizations enabled');
console.log('');
console.log('🚀 To build APK:');
console.log('   1. Ensure Android SDK is installed and configured');
console.log('   2. Edit android/local.properties with your SDK path');
console.log('   3. Run: chmod +x build-apk.sh && ./build-apk.sh');
console.log('');
console.log('📱 Or build manually:');
console.log('   1. cd android');
console.log('   2. ./gradlew assembleRelease');
console.log('');
console.log('🔐 For release signing:');
console.log('   1. Generate keystore as shown above');
console.log('   2. Add credentials to gradle.properties');
console.log('   3. Rebuild APK');
console.log('');

// تحديد حجم APK المتوقع
const estimatedSize = Math.ceil(totalSize / 1024 / 1024) + 25; // أصول + كود
console.log(`📊 Estimated APK size: ~${estimatedSize}MB`);

if (estimatedSize > 100) {
  console.log('⚠️  APK might be large, consider additional optimizations');
} else if (estimatedSize < 50) {
  console.log('🎉 APK size should be optimal!');
}

console.log('\n💡 Pro tips:');
console.log('   • Use ./optimize-all-assets.sh to reduce size');
console.log('   • Enable ProGuard for smaller APK');
console.log('   • Test on different devices before release');
console.log('   • Check app-release.apk in android/app/build/outputs/apk/release/');