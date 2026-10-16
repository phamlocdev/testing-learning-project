import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const repoRoot = path.resolve(__dirname, '../..');

export default defineConfig({
  testDir: './tests',
  // Production smoke test lives here but runs through playwright.prod.config.ts
  // instead (different baseURL, no local webServer) — exclude it from this run.
  testIgnore: '**/smoke/**',
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
      // Scoped to this process only — a job-level PORT env var (as CI sets for the
      // api) would also reach `next dev` below, since Next.js honors $PORT too, and
      // the two servers would fight over the same port.
      env: { PORT: '3001' },
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
