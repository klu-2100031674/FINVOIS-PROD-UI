/**
 * node scripts/audit-storage.js [dir]      (npm run audit:storage)
 *
 * Fails (exit 1) when app source contains something doc 06 forbids: persistent storage other than
 * auth/storage.ts, console output, hard-coded URLs, or secret-looking literals. Matches are reported
 * as file:line and rule only; the matched text is never printed.
 *
 * Allow-list (kept deliberately small):
 *  - localStorage / sessionStorage: only in src/auth/storage.ts (web test harness fallback).
 *  - URLs: the doc hosts and the wa.me deep link in ALLOWED_URL_PREFIXES. Anything else needs `audit-allow: <why>` on the same line.
 *  - Comment-only lines and __tests__ / *.test.* files are not scanned.
 */
/* global __dirname */
const fs = require('fs');
const path = require('path');

const ALLOWED_URL_PREFIXES = [
  'http://www.w3.org/',
  'https://www.w3.org/',
  'https://docs.expo.dev/',
  'https://expo.dev/',
  'https://reactnative.dev/',
  'https://wa.me/', // WhatsApp click-to-chat deep link for the applicant (doc 03 F7); opens the WhatsApp app, no data sent by us
];

const SECRET_NAME = '(?:secret|password|passwd|api[_-]?key|private[_-]?key|access[_-]?token|refresh[_-]?token|auth[_-]?token)';

const RULES = [
  { id: 'async-storage', re: /AsyncStorage|async-storage/, msg: 'AsyncStorage is not allowed. Persist only through auth/storage.ts.' },
  { id: 'mmkv', re: /MMKV/, msg: 'MMKV is not allowed. Persist only through auth/storage.ts.' },
  {
    id: 'web-storage',
    re: /\b(?:localStorage|sessionStorage)\b/,
    allowIn: ['auth/storage.ts'],
    msg: 'localStorage/sessionStorage is only allowed in auth/storage.ts.',
  },
  { id: 'console', re: /\bconsole\.(?:log|debug|info)\s*\(/, msg: 'console.log/debug/info is not allowed (no PII or tokens in logs).' },
  {
    id: 'url',
    re: /https?:\/\/[^\s'"`)]+/g,
    isAllowed: (match) => ALLOWED_URL_PREFIXES.some((p) => match.startsWith(p)),
    msg: 'Hard-coded URL. Use EXPO_PUBLIC_API_BASE_URL, an allow-listed doc link, or add "audit-allow: <why>".',
  },
  {
    id: 'secret',
    re: new RegExp(
      [
        'eyJ[A-Za-z0-9_-]{8,}\\.[A-Za-z0-9_-]{8,}\\.', // JWT
        '-----BEGIN [A-Z ]*PRIVATE KEY-----',
        'AKIA[0-9A-Z]{16}', // AWS access key id
        'AIza[0-9A-Za-z_-]{35}', // Google API key
        '\\b(?:sk|rk)_live_[0-9A-Za-z]{10,}',
        '\\bgh[pousr]_[A-Za-z0-9]{30,}',
        'xox[baprs]-[A-Za-z0-9-]{10,}',
        `${SECRET_NAME}\\w*['"]?\\s*[:=]\\s*['"][^'"\\s]{12,}['"]`, // name = 'long-literal'
      ].join('|'),
      'i'
    ),
    msg: 'Secret-looking literal. Secrets never belong in the bundle.',
  },
];

const SOURCE = /\.(?:[jt]sx?)$/;
const SKIPPED_FILE = /\.(?:test|spec)\.[jt]sx?$/;
const isCommentLine = (line) => /^\s*(?:\/\/|\/\*|\*)/.test(line);

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '__tests__') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (SOURCE.test(entry.name) && !SKIPPED_FILE.test(entry.name)) yield full;
  }
}

/** Returns [{ file, line, rule, msg }] for every violation under `root`. */
function scan(root) {
  const findings = [];
  for (const file of walk(root)) {
    const rel = path.relative(root, file).split(path.sep).join('/');
    fs.readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .forEach((text, i) => {
        if (isCommentLine(text) || text.includes('audit-allow')) return;
        for (const rule of RULES) {
          if (rule.allowIn && rule.allowIn.includes(rel)) continue;
          const hits = text.match(rule.re); // the url rule is /g so it returns every URL on the line
          if (!hits) continue;
          if (rule.isAllowed && hits.every((m) => rule.isAllowed(m))) continue;
          findings.push({ file: rel, line: i + 1, rule: rule.id, msg: rule.msg });
        }
      });
  }
  return findings;
}

module.exports = { scan };

if (require.main === module) {
  const root = path.resolve(process.argv[2] || path.join(__dirname, '..', 'src'));
  const findings = scan(root);
  findings.forEach((f) => console.error(`${f.file}:${f.line}  [${f.rule}] ${f.msg}`));
  if (findings.length) {
    console.error(`\naudit:storage failed with ${findings.length} finding(s).`);
    process.exit(1);
  }
  console.log('audit:storage passed.');
}
