module.exports = function(api) {
  api.cache(true);  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Enable reanimated plugin FIRST
      'react-native-reanimated/plugin',
      
      // Enable React Native web support
      'react-native-web', 

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
      ]
    ],
  };
};
