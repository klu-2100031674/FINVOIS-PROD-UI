const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Parallel e2e runs each get their own transform cache. EXPO_PUBLIC_* values are inlined at
// transform time, so a shared cache would leak one slot's API URL into another's bundle.
if (process.env.E2E_SLOT) {
  const { FileStore } = require('metro-cache');
  config.cacheStores = [
    new FileStore({ root: path.join(__dirname, 'node_modules', '.cache', `metro-slot${process.env.E2E_SLOT}`) }),
  ];
}

module.exports = withNativeWind(config, { input: './global.css' });
