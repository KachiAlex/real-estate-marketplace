const {getDefaultConfig} = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add asset resolution
config.resolver.assetExts.push(
  // Images
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'svg',
  // Fonts
  'ttf',
  'otf',
  'woff',
  'woff2'
);

module.exports = config;
