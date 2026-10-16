import { defineConfig } from '@playwright/test';

// Smoke test against the real deployed app — no webServer here (nothing to start
// locally), and a separate config from playwright.config.ts so `pnpm --filter e2e test`
// (local dev stack) never accidentally hits production.
export default defineConfig({
  testDir: './tests/smoke',
  fullyParallel: true,
  workers: 1,
  // Render's free tier spins the api down after inactivity; the first request can take
  // 30-50s to cold-start. One retry absorbs that without masking a real failure (a
  // genuinely broken deploy still fails twice).
  retries: 1,
  timeout: 90_000,
  use: {
    baseURL: 'https://testing-learning-project.vercel.app',
    trace: 'retain-on-failure',
    actionTimeout: 60_000,
    navigationTimeout: 60_000,
  },
});
