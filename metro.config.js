const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Supabase fix
config.resolver.unstable_conditionNames = ["browser"];
config.resolver.unstable_enablePackageExports = false;

// Add resolver for Node.js modules
config.resolver.extraNodeModules = {
  // Provide WebSocket implementation
  ws: 'react-native-websocket',
  // Other Node.js core modules if needed
  crypto: require.resolve('crypto-browserify'),
  stream: require.resolve('stream-browserify'),
  tls: require.resolve('tls-browserify'),
  http: require.resolve('@tradle/react-native-http'),
  https: require.resolve('https-browserify'),
  os: require.resolve('os-browserify/browser'),
  path: require.resolve('path-browserify'),
  fs: require.resolve('react-native-fs'),
  net: require.resolve('react-native-tcp'),
};

module.exports = config; 