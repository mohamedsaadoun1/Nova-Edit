/**
 * Metro Configuration for Nova Edit Mobile - Optimized
 * تكوين محسن لـ Metro لتحسين أداء البناء وتقليل حجم Bundle
 * 
 * @format
 */

const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('@react-native/metro-config');

// إعدادات تحسين مخصصة
const config = getDefaultConfig(__dirname);

// تحسين الأصول (Assets)
config.resolver.assetExts = [
  // صور محسنة
  'png', 'jpg', 'jpeg', 'webp', 'gif', 'svg',
  // أصوات محسنة  
  'mp3', 'wav', 'ogg', 'm4a',
  // خطوط
  'ttf', 'otf', 'woff', 'woff2',
  // فيديو (للمعاينات فقط)
  'mp4', 'webm',
  // ملفات أخرى
  'json', 'txt'
];

// ملفات المصدر
config.resolver.sourceExts = [
  'js', 'jsx', 'ts', 'tsx', 'json',
  // إضافة دعم للملفات المحلية
  'local.js', 'offline.js'
];

// تحسين التحويل (Transform)
config.transformer = {
  ...config.transformer,
  // تحسين صور PNG/JPG
  assetRegistryPath: 'react-native/Libraries/Image/AssetRegistry',
  
  // تحسين خاص بـ React Native
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true, // تحسين التحميل
    },
  }),
  
  // تحسين ملفات SVG
  svgAssetPlugin: {
    enabled: true,
    dimensions: true,
  }
};

// تحسين الحلال (Resolver)
config.resolver = {
  ...config.resolver,
  
  // حل سريع للمكتبات
  alias: {
    // استبدال خدمات APIs بمكتبات محلية
    '@services/PixabayService': './services/LocalImageLibrary',
    '@services/FreesoundService': './services/LocalSoundLibrary', 
    '@services/GoogleFontsService': './services/LocalFontLibrary',
    
    // اختصارات مفيدة
    '@components': './components',
    '@services': './services',
    '@assets': './assets',
    '@types': './types',
    '@utils': './utils',
    '@store': './store'
  },
  
  // منصات مدعومة
  platforms: ['ios', 'android', 'native', 'web'],
  
  // استبعاد مكتبات غير ضرورية
  blockList: [
    // استبعاد ملفات التطوير
    /.*\/__tests__\/.*/,
    /.*\/node_modules\/.*\/test\/.*/,
    /.*\/node_modules\/.*\/tests\/.*/,
    
    // استبعاد APIs المعطلة
    /.*\/services\/external\/.*\.deprecated\..*/,
    
    // استبعاد ملفات المثال
    /.*\/example\/.*/,
    /.*\/examples\/.*/,
    /.*\/demo\/.*/,
    
    // استبعاد documentation
    /.*\/docs?\/.*/,
    /.*\/\.git\/.*/,
  ]
};

// تحسين الخادم المحلي
config.server = {
  ...config.server,
  port: 8081,
  
  // تحسين الكاش
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // إضافة headers للكاش
      if (req.url.match(/\.(png|jpg|jpeg|gif|webp|svg|ttf|otf|mp3|wav)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // سنة واحدة
      }
      return middleware(req, res, next);
    };
  }
};

// تحسين Serializer (تجميع الكود)
config.serializer = {
  ...config.serializer,
  
  // تحسين الـ Bundle
  createModuleIdFactory: () => {
    let nextId = 0;
    return (path) => {
      // إعطاء IDs قصيرة للمكتبات المحلية
      if (path.includes('/services/Local')) {
        return `L${nextId++}`;
      }
      if (path.includes('/components/')) {
        return `C${nextId++}`;
      }
      return nextId++;
    };
  },
  
  // ضغط إضافي للبرمجة
  getModulesRunBeforeMainModule: () => [
    require.resolve('react-native/Libraries/Core/InitializeCore'),
  ],
  
  // استبعاد ملفات غير ضرورية من Bundle
  getPolyfills: () => [],
  
  // تحسين Bundle للإنتاج
  processModuleFilter: (modules) => {
    return modules.filter(module => {
      // استبعاد ملفات التطوير
      if (module.path.includes('__DEV__')) return false;
      if (module.path.includes('.test.')) return false;
      if (module.path.includes('.spec.')) return false;
      
      // استبعاد APIs المعطلة
      if (module.path.includes('/external/PixabayService')) return false;
      if (module.path.includes('/external/FreesoundService')) return false;
      if (module.path.includes('/external/GoogleFontsService')) return false;
      
      return true;
    });
  }
};

// تحسين الـ Watcher (مراقب الملفات)
config.watcher = {
  ...config.watcher,
  
  // تجاهل مجلدات غير ضرورية
  ignore: [
    /node_modules\/.*\/node_modules\/.*/,
    /.*\/\.git\/.*/,
    /.*\/\.vscode\/.*/,
    /.*\/\.idea\/.*/,
    /.*\/build\/.*/,
    /.*\/dist\/.*/,
    /.*\/coverage\/.*/,
    
    // تجاهل ملفات كبيرة
    /.*\.(log|tmp|temp)$/,
    /.*\/\.DS_Store$/,
    
    // تجاهل ملفات النسخ الاحتياطية
    /.*~$/,
    /.*\.bak$/,
  ],
  
  // تحسين مراقبة الملفات
  watchman: {
    deferStates: ['hg.update'],
  }
};

// إعدادات خاصة ببيئة الإنتاج
if (process.env.NODE_ENV === 'production') {
  // تحسينات إضافية للإنتاج
  config.transformer.minifierPath = 'metro-minify-terser';
  config.transformer.minifierConfig = {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
    compress: {
      drop_console: true, // إزالة console.log في الإنتاج
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.warn', 'console.info'],
    },
  };
}

// إعدادات Hermes المحسنة
config.transformer.hermesCommand = 'hermesc';

// تحسين كاش Metro
config.cacheStores = [
  {
    name: 'filesystem',
    directory: './node_modules/.cache/metro',
  }
];

// تصدير التكوين النهائي
module.exports = mergeConfig(config, {
  // إعدادات إضافية يمكن دمجها هنا
  projectRoot: __dirname,
  watchFolders: [
    // مجلدات إضافية لمراقبتها
    './services',
    './components', 
    './assets'
  ],
});

// طباعة معلومات التحسين
if (process.env.NODE_ENV !== 'test') {
  console.log('🚀 Metro Config Optimized for Nova Edit:');
  console.log('  ✅ Asset optimization enabled');
  console.log('  ✅ Bundle size reduction enabled');
  console.log('  ✅ Local services aliases configured');
  console.log('  ✅ Cache optimization enabled');
  console.log('  ✅ Production minification ready');
  
  if (process.env.NODE_ENV === 'production') {
    console.log('  🏭 Production optimizations active');
    console.log('  📦 Console.log statements will be removed');
  }
}