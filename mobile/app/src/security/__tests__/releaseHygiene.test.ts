import path from 'path';
import config from '../../../app.config';
import pkg from '../../../package.json';

// Release hygiene from doc 06 section 8 that can be checked without a device: the merged Expo config and the
// Babel pipeline. What only a signed build can show (debuggable, dev menu, R8) is in docs/security-signoff-app.md.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- no type package for @babel/core in this project
const { transformSync } = require('@babel/core') as {
  transformSync: (code: string, opts: object) => { code: string };
};

const root = path.join(__dirname, '..', '..', '..');
const compile = (envName: string) =>
  transformSync('console.log(1); console.info(2); console.debug(3); console.warn(4); console.error(5); export const ok = 1;', {
    filename: path.join(root, 'src', 'probe.ts'),
    configFile: path.join(root, 'babel.config.js'),
    envName,
    caller: { name: 'metro', bundler: 'metro', platform: 'ios' },
  }).code;

describe('babel', () => {
  it('strips every console call from production bundles', () => {
    const out = compile('production');
    expect(out).not.toMatch(/console\./);
    expect(out).toMatch(/ok/); // the rest of the module is still there
  });

  it('keeps console in development so debugging still works', () => {
    expect(compile('development')).toMatch(/console\./);
  });
});

describe('app config', () => {
  const plugins = (config.plugins ?? []) as (string | [string, Record<string, unknown>])[];
  const options = (name: string) => plugins.find((p) => Array.isArray(p) && p[0] === name)?.[1];

  it('turns off Android backup', () => {
    expect(config.android?.allowBackup).toBe(false);
  });

  it('turns off cleartext HTTP on Android and sets no iOS ATS exception', () => {
    expect(options('expo-build-properties')).toMatchObject({ android: { usesCleartextTraffic: false } });
    const plist = (config.ios?.infoPlist ?? {}) as Record<string, unknown>;
    expect(plist).not.toHaveProperty('NSAppTransportSecurity');
  });

  it('turns on R8 minification and resource shrinking for Android release builds', () => {
    expect(options('expo-build-properties')).toMatchObject({
      android: { enableMinifyInReleaseBuilds: true, enableShrinkResourcesInReleaseBuilds: true },
    });
  });

  it('blocks the storage and overlay permissions that doc 07 does not allow', () => {
    expect(config.android?.blockedPermissions).toEqual(
      expect.arrayContaining([
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.SYSTEM_ALERT_WINDOW',
      ])
    );
    expect(config.android?.permissions ?? []).toEqual([]); // nothing requested beyond library defaults
  });

  it('declares only the finovis scheme and no custom Android intent filters', () => {
    expect(config.scheme).toBe('finovis');
    expect(config.android?.intentFilters).toBeUndefined();
  });

  it('puts nothing but the public API URL and the public EAS project id into extra', () => {
    expect(Object.keys(config.extra ?? {})).toEqual(['apiBaseUrl', 'eas']);
    expect(Object.keys(config.extra?.eas ?? {})).toEqual(['projectId']);
  });

  it('ships no dev client or other dev menu', () => {
    const deps = Object.keys({ ...pkg.dependencies });
    expect(deps.filter((d) => /dev-client|dev-launcher|dev-menu|reactotron|flipper/i.test(d))).toEqual([]);
  });
});
