module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)'],
  moduleNameMapper: { '^~/(.*)$': '<rootDir>/src/$1', '^@/(.*)$': '<rootDir>/src/$1' },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@rn-primitives/.*|nativewind|react-native-css-interop|lucide-react-native|react-native-svg))',
  ],
  setupFiles: ['<rootDir>/jest.setup.js'],
};
