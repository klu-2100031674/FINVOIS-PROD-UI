import type { ExpoConfig } from 'expo/config';

// Only the public API base URL comes from the environment. No secrets belong here.
const config: ExpoConfig = {
  name: 'Finvois',
  slug: 'finovis-mobile',
  version: '1.0.0',
  scheme: 'finovis',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  icon: './assets/icon.png',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.finovis.mobile', // TODO owner: confirm final id before first store upload
    infoPlist: { ITSAppUsesNonExemptEncryption: false },
  },
  android: {
    package: 'com.finovis.mobile', // TODO owner: confirm final id before first store upload
    allowBackup: false,
    // Firebase project finvois-mobile. The file is git-ignored; on EAS set the GOOGLE_SERVICES_JSON file variable.
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
    // Doc 07 allows INTERNET, POST_NOTIFICATIONS and the justified library defaults only.
    blockedPermissions: [
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.SYSTEM_ALERT_WINDOW',
    ],
    adaptiveIcon: {
      backgroundColor: '#FFFFFF',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
  },
  web: { bundler: 'metro', favicon: './assets/favicon.png' },
  plugins: [
    'expo-secure-store',
    'expo-font',
    'expo-sharing',
    [
      'expo-build-properties',
      {
        android: {
          usesCleartextTraffic: false,
          enableMinifyInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
        },
        ios: {},
      },
    ],
    // Status-bar notification icon: Android only uses its shape (alpha), so the monochrome F mark works.
    ['expo-notifications', { color: '#7c3aed', icon: './assets/android-icon-monochrome.png' }],
    // Launch screen: the Finvois F mark on white, shown until the JS bundle has loaded.
    ['expo-splash-screen', { image: './assets/splash-icon.png', imageWidth: 180, resizeMode: 'contain', backgroundColor: '#ffffff' }],
    ['expo-local-authentication', { faceIDPermission: 'Use Face ID to unlock Finvois.' }],
  ],
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
    // Set by `eas init` (or EAS_PROJECT_ID). Push tokens are unavailable until this exists.
    eas: { projectId: process.env.EAS_PROJECT_ID },
  },
};

export default config;
