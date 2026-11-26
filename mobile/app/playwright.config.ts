import { defineConfig, devices } from '@playwright/test';

// Each run gets its own "slot" so several runs can execute at once without sharing ports,
// builds, or database state. Use `node scripts/e2e-run.js <slot> [playwright args]`.
const slot = Number(process.env.E2E_SLOT ?? 0);
const webPort = 8100 + slot;
const apiPort = 5100 + slot;

export default defineConfig({
  testDir: './e2e',
  timeout: 45000,
  workers: 1,
  fullyParallel: false,
  retries: 0,
  outputDir: `test-results/slot${slot}`,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${webPort}`,
    ...devices['Pixel 7'],
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  metadata: { apiBase: `http://127.0.0.1:${apiPort}` },
  webServer: [
    {
      // Real Express app on an in-memory MongoDB, seeded with throwaway test accounts.
      // Expects DPR-BACKEND (prod API) as a sibling of FINVOIS-PROD-UI, on a branch that has the
      // /api/mobile routes and scripts/mobile-e2e-server.js (merge-mobile-into-main). E2E_API_DIR overrides the folder.
      command: `node ${process.env.E2E_API_DIR ?? '../../../DPR-BACKEND'}/scripts/mobile-e2e-server.js`,
      env: { PORT: String(apiPort) },
      url: `http://127.0.0.1:${apiPort}/__e2e/health`,
      reuseExistingServer: false,
      timeout: 120000,
    },
    {
      command: `npx serve dist-slot${slot} -l ${webPort} --single`,
      url: `http://localhost:${webPort}`,
      reuseExistingServer: false,
      timeout: 60000,
    },
  ],
});
