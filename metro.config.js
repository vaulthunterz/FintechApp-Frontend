// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // [Web-only]: Enables CSS support in Metro.
  isCSSEnabled: true,
});

// Add resolution for web-specific modules
config.resolver.resolverMainFields = ['browser', 'main'];

// Optimize asset loading
config.transformer.assetPlugins = ['expo-asset/tools/hashAssetFiles'];

// Add support for monorepos if needed
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Add watchman configuration to handle Windows-specific issues
config.watchFolders = [__dirname];
config.resolver.nodeModulesPaths = [__dirname + '/node_modules'];

// Workaround for Windows file watching issues
config.server = {
  ...config.server,
  useWatchman: false, // Disable watchman on Windows
};

config.watcher = {
  ...config.watcher,
  watchman: {
    enabled: false // Disable watchman explicitly
  }
};

module.exports = config;
