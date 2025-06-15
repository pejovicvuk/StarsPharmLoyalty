const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Supabase fix
config.resolver.unstable_conditionNames = ["browser"];
config.resolver.unstable_enablePackageExports = false;

// Add resolver for Node.js modules
config.resolver.extraNodeModules = {
  // Other Node.js core modules if needed
  fs: require.resolve('react-native-fs'),
};

module.exports = config; 