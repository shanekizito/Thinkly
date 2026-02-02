const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Workaround for Windows path issue with node: protocol
config.resolver = {
  ...config.resolver,
  unstable_enablePackageExports: false,
  // Add support for path aliases
  extraNodeModules: {
    '@': path.resolve(__dirname),
    '~': path.resolve(__dirname, 'app'),
  },
};

module.exports = config;

