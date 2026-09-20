// Playwright config for the acceptance suite. Tests share one real
// Firebase database, so they run serially in a single worker.
//
// If PLAYWRIGHT_BROWSERS_PATH points at a pre-installed Chromium, Playwright
// picks it up automatically; no separate install step is needed here.
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'tests',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  // Set EXPECT_TIMEOUT and TEST_TIMEOUT (milliseconds) on slow connections.
  timeout: Number(process.env.TEST_TIMEOUT) || 60000,
  expect: {
    timeout: Number(process.env.EXPECT_TIMEOUT) || 5000,
  },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    permissions: ['clipboard-read', 'clipboard-write'],
    // Set IGNORE_HTTPS_ERRORS=1 when running behind a proxy that re-signs TLS.
    ignoreHTTPSErrors: process.env.IGNORE_HTTPS_ERRORS === '1',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npx http-server -p 4173 -s -c-1 .',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
  },
});
