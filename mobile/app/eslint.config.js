const expoConfig = require('eslint-config-expo/flat');
const { defineConfig } = require('eslint/config');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/**', 'dist-slot*/**', 'playwright-report/**', 'test-results/**', 'e2e/screenshots/**', '.expo/**'],
  },
  {
    // `~/` and `@/` map to src/ (tsconfig paths, babel, jest); the TypeScript resolver covers both.
    settings: { 'import/resolver': { typescript: { project: './tsconfig.json' } } },
  },
]);
