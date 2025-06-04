module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: undefined }]
    ],
    plugins: [
      // React Native Reanimated plugin
      'react-native-reanimated/plugin',
      
      // React Native Vector Icons
      [
        'react-native-vector-icons/lib/commonjs/babel',
        {
          platform: 'android',
          packageName: 'react-native-vector-icons'
        }
      ],
      
      // FFmpeg Kit React Native
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@components': './components',
            '@services': './services',
            '@assets': './assets',
            '@types': './types',
            '@utils': './utils',
            '@store': './store',
            '@config': './config',
            '@hooks': './hooks'
          }
        }
      ],
      
      // Optional chaining and nullish coalescing
      '@babel/plugin-transform-optional-chaining',
      '@babel/plugin-transform-nullish-coalescing-operator',
      
      // React Native compatibility
      '@babel/plugin-transform-flow-strip-types',
      ['@babel/plugin-proposal-class-properties', { loose: true }],
      ['@babel/plugin-transform-private-methods', { loose: true }],
      ['@babel/plugin-transform-private-property-in-object', { loose: true }]
    ],
    env: {
      production: {
        plugins: [
          'react-native-paper/babel',
          ['react-native-reanimated/plugin']
        ]
      }
    }
  };
};