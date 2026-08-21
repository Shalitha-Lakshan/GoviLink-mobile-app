const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure Metro resolves .cjs files for Firebase JS SDK compatibility
config.resolver.sourceExts.push('cjs');

module.exports = config;
