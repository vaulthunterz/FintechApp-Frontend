module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Enable React Native web support
      'react-native-web',
      
      // Support for the Expo Router
      'expo-router/babel',
      
      // Add module resolver for cleaner imports
      [
        'module-resolver',
        {
          alias: {
            '@': './',
            '@components': './app/components',
            '@screens': './app/screens',
            '@contexts': './app/contexts',
            '@services': './app/services',
            '@utils': './app/utils',
          },
        },
      ],
      
      // Add React Native reanimated support if needed
      'react-native-reanimated/plugin',
    ],
  };
};
