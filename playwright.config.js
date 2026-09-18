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
  timeout: 60000,
  expect: {
    timeout: 5000,
  },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    permissions: ['clipboard-read', 'clipboard-write'],
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
