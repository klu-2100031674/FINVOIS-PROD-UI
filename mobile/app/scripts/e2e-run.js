/**
 * node scripts/e2e-run.js <slot> [playwright args...]
 * Builds the web export against this slot's local API, then runs Playwright.
 * Slots keep parallel runs isolated (web port 8100+slot, API port 5100+slot, dist-slot<slot>).
 */
const { spawnSync } = require('child_process');

const slot = Number(process.argv[2]);
if (!Number.isInteger(slot) || slot < 0 || slot > 30) {
  console.error('usage: node scripts/e2e-run.js <slot 0-30> [playwright args]');
  process.exit(2);
}
const apiPort = 5100 + slot;
const env = {
  ...process.env,
  E2E_SLOT: String(slot),
  EXPO_PUBLIC_API_BASE_URL: `http://127.0.0.1:${apiPort}/api`,
  EXPO_NO_TELEMETRY: '1',
  CI: '1',
};
const run = (cmd, args) => spawnSync(cmd, args, { stdio: 'inherit', env, shell: true });

let r = run('npx', ['expo', 'export', '-p', 'web', '--output-dir', `dist-slot${slot}`]);
if (r.status !== 0) process.exit(r.status || 1);
r = run('npx', ['playwright', 'test', ...process.argv.slice(3)]);
process.exit(r.status || 0);
