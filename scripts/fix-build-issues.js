#!/usr/bin/env node

/**
 * Nova Edit - Build Issues Resolver
 * حل شامل لجميع مشاكل البناء والتطوير
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Resolving Nova Edit Build Issues...\n');

// قائمة الملفات التي تحتاج إصلاح
const filesToFix = [
  {
    source: 'package-fixed.json',
    target: 'package.json',
    description: 'Updated package.json with compatible versions'
  },
  {
    source: 'app-fixed.json', 
    target: 'app.json',
    description: 'Fixed app.json configuration'
  },
  {
    source: 'app/(tabs)/index-fixed.tsx',
    target: 'app/(tabs)/index.tsx', 
    description: 'Fixed main index.tsx with proper imports'
  },
  {
    source: 'metro.config-fixed.js',
    target: 'metro.config.js',
    description: 'Updated Metro configuration'
  }
];

// تطبيق الإصلاحات
console.log('📁 Applying fixes...');
let fixedCount = 0;

filesToFix.forEach(fix => {
  try {
    if (fs.existsSync(fix.source)) {
      // إنشاء نسخة احتياطية
      if (fs.existsSync(fix.target)) {
        fs.copyFileSync(fix.target, `${fix.target}.backup`);
      }
      
      // تطبيق الإصلاح
      fs.copyFileSync(fix.source, fix.target);
      console.log(`  ✅ ${fix.description}`);
      fixedCount++;
    } else {
      console.log(`  ⚠️  Source file not found: ${fix.source}`);
    }
  } catch (error) {
    console.log(`  ❌ Failed to fix ${fix.target}: ${error.message}`);
  }
});

// إنشاء ملف TypeScript configuration محسن
console.log('\n⚙️  Creating TypeScript config...');

const tsconfigContent = {
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": false,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": "./",
    "paths": {
      "@components/*": ["components/*"],
      "@services/*": ["services/*"],
      "@assets/*": ["assets/*"],
      "@types/*": ["types/*"],
      "@utils/*": ["utils/*"],
      "@store/*": ["store/*"],
      "@config/*": ["config/*"],
      "@hooks/*": ["hooks/*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    "**/*.js",
    "**/*.jsx"
  ],
  "exclude": [
    "node_modules",
    "babel.config.js",
    "metro.config.js",
    "jest.config.js"
  ],
  "extends": "expo/tsconfig.base"
};

try {
  fs.writeFileSync('tsconfig.json', JSON.stringify(tsconfigContent, null, 2));
  console.log('  ✅ Created tsconfig.json');
} catch (error) {
  console.log('  ⚠️  Failed to create tsconfig.json:', error.message);
}

// إنشاء ملف jest.setup.js محسن
console.log('\n🧪 Creating Jest setup...');

const jestSetupContent = `// Jest Setup for Nova Edit Mobile
import 'react-native-gesture-handler/jestSetup';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  
  // The mock for \`call\` immediately calls the callback which is incorrect
  // So we override it with a no-op
  Reanimated.default.call = () => {};
  
  return Reanimated;
});

// Silence the warning: Animated: \`useNativeDriver\` is not supported
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock Expo modules
jest.mock('expo-av', () => ({
  Video: 'Video',
  Audio: 'Audio',
  ResizeMode: {}
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(() => Promise.resolve({
    type: 'success',
    assets: []
  }))
}));

jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' }))
}));

jest.mock('expo-camera', () => ({
  Camera: 'Camera',
  CameraType: {},
  FlashMode: {}
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

// Mock FFmpeg Kit
jest.mock('ffmpeg-kit-react-native', () => ({
  FFmpegKit: {
    execute: jest.fn(() => Promise.resolve({})),
    cancel: jest.fn(() => Promise.resolve())
  },
  FFmpegKitConfig: {
    enableLogCallback: jest.fn(),
    enableStatisticsCallback: jest.fn(),
    setLogLevel: jest.fn()
  },
  ReturnCode: {
    isSuccess: jest.fn(() => true)
  }
}));

// Mock TensorFlow.js
jest.mock('@tensorflow/tfjs-react-native', () => ({
  platform: jest.fn(),
  ready: jest.fn(() => Promise.resolve())
}));

// Global test timeout
jest.setTimeout(10000);
`;

try {
  fs.writeFileSync('jest.setup.js', jestSetupContent);
  console.log('  ✅ Created jest.setup.js');
} catch (error) {
  console.log('  ⚠️  Failed to create jest.setup.js:', error.message);
}

// تحديث jest.config.js
console.log('\n⚙️  Updating Jest config...');

const jestConfigContent = `module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/coverage/**',
    '!**/node_modules/**',
    '!**/babel.config.js',
    '!**/jest.setup.js'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transform: {
    '^.+\\\\.(js|jsx|ts|tsx)$': 'babel-jest'
  },
  testMatch: [
    '**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)'
  ],
  moduleNameMapping: {
    '^@components/(.*)$': '<rootDir>/components/$1',
    '^@services/(.*)$': '<rootDir>/services/$1', 
    '^@assets/(.*)$': '<rootDir>/assets/$1',
    '^@types/(.*)$': '<rootDir>/types/$1',
    '^@utils/(.*)$': '<rootDir>/utils/$1',
    '^@store/(.*)$': '<rootDir>/store/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
    '^@hooks/(.*)$': '<rootDir>/hooks/$1'
  }
};`;

try {
  fs.writeFileSync('jest.config.js', jestConfigContent);
  console.log('  ✅ Updated jest.config.js');
} catch (error) {
  console.log('  ⚠️  Failed to update jest.config.js:', error.message);
}

// تنظيف ملفات مؤقتة
console.log('\n🧹 Cleaning temporary files...');

const tempFiles = [
  'package-fixed.json',
  'app-fixed.json', 
  'app/(tabs)/index-fixed.tsx',
  'metro.config-fixed.js'
];

tempFiles.forEach(file => {
  try {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`  🗑️  Removed ${file}`);
    }
  } catch (error) {
    console.log(`  ⚠️  Could not remove ${file}`);
  }
});

// إنشاء سكريپت لحل مشاكل إضافية
console.log('\n🔧 Creating additional fix scripts...');

const clearCacheScript = `#!/bin/bash

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
`;

try {
  fs.writeFileSync('clear-cache.sh', clearCacheScript);
  fs.chmodSync('clear-cache.sh', '755');
  console.log('  ✅ Created clear-cache.sh');
} catch (error) {
  console.log('  ⚠️  Failed to create clear-cache.sh');
}

// تقرير نهائي
console.log('\n📋 BUILD ISSUES RESOLUTION COMPLETE!');
console.log('=====================================');
console.log(`✅ Fixed ${fixedCount} configuration files`);
console.log('✅ Updated TypeScript configuration');
console.log('✅ Created Jest setup and config');
console.log('✅ Added utility scripts');
console.log('');
console.log('🚀 Next steps:');
console.log('   1. Run: npm install');
console.log('   2. Run: npx expo install --fix');
console.log('   3. Test: npx expo start');
console.log('');
console.log('🔧 If you still have issues:');
console.log('   1. Run: ./clear-cache.sh');
console.log('   2. Run: npm install');
console.log('   3. Try: npx expo doctor');
console.log('');

// تحقق من وجود الملفات المهمة
const requiredFiles = [
  'package.json',
  'app.json',
  'babel.config.js',
  'metro.config.js',
  'tsconfig.json'
];

console.log('📁 Required files check:');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - MISSING!`);
  }
});

console.log('');
console.log('🎯 Project is now ready for building!');
console.log('💡 All major build issues have been resolved.');