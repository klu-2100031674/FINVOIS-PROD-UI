import fs from 'fs';
import os from 'os';
import path from 'path';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- CommonJS script shared with npm run audit:storage
const { scan } = require('../../../scripts/audit-storage') as {
  scan: (root: string) => { file: string; line: number; rule: string }[];
};

// Fixtures are written to a temp folder so the real audit never sees these deliberate violations.
let root: string;
const write = (rel: string, body: string) => {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, body);
};
const rules = (rel: string) =>
  scan(root)
    .filter((f) => f.file === rel)
    .map((f) => f.rule);

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-'));
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

describe('audit-storage scan', () => {
  it('passes clean code', () => {
    write('a.ts', "export const x = 1;\nconsole.error('boom');\nconst ns = 'http://www.w3.org/2000/svg';\nconst wa = `https://wa.me/${1}`;\n");
    expect(scan(root)).toEqual([]);
  });

  it('flags AsyncStorage and MMKV', () => {
    write('a.ts', "import AsyncStorage from '@react-native-async-storage/async-storage';");
    write('b.ts', "import { MMKV } from 'react-native-mmkv';");
    expect(rules('a.ts')).toContain('async-storage');
    expect(rules('b.ts')).toContain('mmkv');
  });

  it('allows localStorage and sessionStorage only in auth/storage.ts', () => {
    write('auth/storage.ts', 'const s = sessionStorage;');
    write('other.ts', "localStorage.setItem('k', 'v');");
    expect(rules('auth/storage.ts')).toEqual([]);
    expect(rules('other.ts')).toEqual(['web-storage']);
  });

  it('flags console.log, debug and info but not warn or error', () => {
    write('a.ts', ['console.log(1);', 'console.debug(1);', 'console.info(1);', 'console.warn(1);', 'console.error(1);'].join('\n'));
    expect(scan(root).filter((f) => f.rule === 'console').map((f) => f.line)).toEqual([1, 2, 3]);
  });

  it('flags hard-coded URLs except allow-listed doc links and audit-allow lines', () => {
    write('a.ts', "const u = 'https://api.example.com/v1';");
    write('b.ts', "const u = 'https://docs.expo.dev/guides/x'; const v = 'http://localhost:3000';");
    write('c.ts', "const u = 'https://policy.example.com'; // audit-allow: store privacy policy");
    expect(rules('a.ts')).toEqual(['url']);
    expect(rules('b.ts')).toEqual(['url']); // localhost is not allow-listed
    expect(rules('c.ts')).toEqual([]);
  });

  it('flags token and key patterns, not ordinary words', () => {
    write('jwt.ts', "const t = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkw.abc';");
    write('key.ts', "const apiKey = 'abcdefghijklmnop';");
    write('pem.ts', "const k = '-----BEGIN RSA PRIVATE KEY-----';");
    write('ok.tsx', "<Input testID=\"password-input\" placeholder=\"Enter your password\" autoComplete=\"current-password\" />\nconst REFRESH_KEY = 'finovis.refreshToken';\nconst passwordError = 'Enter your password again please';");
    expect(rules('jwt.ts')).toEqual(['secret']);
    expect(rules('key.ts')).toEqual(['secret']);
    expect(rules('pem.ts')).toEqual(['secret']);
    expect(rules('ok.tsx')).toEqual([]);
  });

  it('skips comment lines, tests and node_modules', () => {
    write('a.ts', "// AsyncStorage is banned, see https://x.example.com\n/* console.log(1) */\n * localStorage notes");
    write('__tests__/t.ts', "console.log('https://x.example.com');");
    write('a.test.ts', 'AsyncStorage;');
    write('node_modules/m/index.js', 'AsyncStorage;');
    expect(scan(root)).toEqual([]);
  });

  it('does not report the matched secret text', () => {
    write('a.ts', "const apiKey = 'abcdefghijklmnop';");
    expect(JSON.stringify(scan(root))).not.toContain('abcdefghijklmnop');
  });
});
