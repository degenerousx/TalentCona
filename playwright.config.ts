import { defineConfig, devices } from "@playwright/test";

/**
 * Regression tests: the real admin portal (Next.js) running against the fake
 * backend in e2e/mock/server.mjs. No staging data is touched.
 *
 *   npm run test:e2e                 headless, all specs
 *   npx playwright test --ui         watch it click through
 *   npx playwright show-report       last HTML report
 */
const CI = !!process.env.CI;
const MOCK = "http://localhost:4100";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  // One fake backend holds the state, so tests run one at a time.
  workers: 1,
  fullyParallel: false,
  retries: CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: CI ? [["list"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
    viewport: { width: 1440, height: 900 },
  },
  webServer: [
    {
      command: "node e2e/mock/server.mjs",
      url: `${MOCK}/__requests`,
      env: { MOCK_PORT: "4100" },
      reuseExistingServer: !CI,
    },
    {
      // CI tests the production build; locally the dev server is quicker to start.
      command: CI ? "npx next build && npx next start -p 3100" : "npx next dev -p 3100",
      url: "http://localhost:3100/sign-in",
      env: { API_URL: MOCK },
      timeout: 300_000,
      reuseExistingServer: !CI,
    },
  ],
});
