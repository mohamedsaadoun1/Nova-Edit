/**
 * Metro Configuration for Nova Edit Mobile - Fixed
 * تكوين محسن لـ Metro لحل مشاكل البناء والتوافق
 * 
 * @format
 */

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// إعدادات الحلال (Resolver)
config.resolver.assetExts.push(
  // Video formats
  'mp4', 'avi', 'mov', 'mkv', 'webm', '3gp',
  // Audio formats  
  'mp3', 'wav', 'aac', 'ogg', 'm4a',
  // Font formats
  'ttf', 'otf', 'woff', 'woff2',
  // Other assets
  'bin', 'txt', 'jpg', 'png', 'gif', 'webp', 'svg'
);

config.resolver.sourceExts.push(
  'jsx', 'js', 'ts', 'tsx', 'json', 'wasm', 'mjs'
);

// حل مشاكل التبعيات المتضاربة
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // حل مشكلة react-native-vector-icons
  if (moduleName === 'react-native-vector-icons/lib/vector-icon') {
    return {
      filePath: require.resolve('react-native-vector-icons/lib/vector-icon'),
      type: 'sourceFile'
    };
  }
  
  // حل مشكلة FFmpeg Kit
  if (moduleName.startsWith('ffmpeg-kit-react-native')) {
    return {
      filePath: require.resolve('ffmpeg-kit-react-native'),
      type: 'sourceFile'
    };
  }

  // استخدام الحلال الافتراضي للبقية
  return context.resolveRequest(context, moduleName, platform);
};

// إعدادات المحول (Transformer)
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
  
  // تحسين المحول
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
  
  // إعدادات SVG
  svgAssetPlugin: {
    enabled: true,
    dimensions: true,
  }
};

// إعدادات الخادم
config.server = {
  ...config.server,
  port: 8081,
  
  // تحسين الكاش
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // إضافة headers للكاش
      if (req.url.match(/\.(png|jpg|jpeg|gif|webp|svg|ttf|otf|mp3|wav|mp4)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000');
      }
      return middleware(req, res, next);
    };
  }
};

// حل مشاكل التحويل
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// استبعاد ملفات مُعطلة أو غير ضرورية  
config.resolver.blockList = [
  // استبعاد ملفات الاختبار
  /.*\/__tests__\/.*/,
  /.*\/node_modules\/.*\/test\/.*/,
  /.*\/node_modules\/.*\/tests\/.*/,
  
  // استبعاد ملفات المثال والتوثيق
  /.*\/example\/.*/,
  /.*\/examples\/.*/,
  /.*\/demo\/.*/,
  /.*\/docs?\/.*/,
  /.*\/\.git\/.*/,
  
  // استبعاد ملفات مكسورة أو متضاربة
  /.*\/node_modules\/react-native\/.*\/RCTUIKit\.h$/,
  /.*\/node_modules\/react-native\/.*\/RCTDeviceInfo\.h$/,
];

// إعدادات خاصة بـ React Native
config.transformer.minifierPath = 'metro-minify-terser';
config.transformer.minifierConfig = {
  ecma: 8,
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
  compress: {
    drop_console: false, // احتفظ بـ console.log للتطوير
    drop_debugger: true,
  },
};

// إعدادات Metro Cache
config.cacheStores = [
  {
    name: 'filesystem',
    directory: './node_modules/.cache/metro',
  }
];

// تحسين الأداء  
config.maxWorkers = 2;
config.resetCache = false;

module.exports = config;