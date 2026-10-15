import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const repoRoot = path.resolve(__dirname, '../..');

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  // All tests share one `next dev` + one `nest start --watch` instance (see webServer
  // below). `next dev` recompiles routes on demand and gets flaky under concurrent
  // browser sessions, so keep this at 1 worker rather than fighting dev-server
  // contention. Fine at this suite's size; revisit if the suite grows much larger.
  workers: 1,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    // Set PW_SLOW_MO=500 to watch headed runs action-by-action locally.
    // Left undefined by default so normal/CI runs stay at full speed.
    launchOptions: {
      slowMo: process.env.PW_SLOW_MO ? Number(process.env.PW_SLOW_MO) : undefined,
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'pnpm --filter api start:dev',
      cwd: repoRoot,
      url: 'http://localhost:3001',
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: 'pnpm --filter web dev',
      cwd: repoRoot,
      url: 'http://localhost:3000',
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
});
