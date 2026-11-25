import { defineConfig, devices } from "@playwright/test";

const URL = "http://localhost:8787";

export default defineConfig({
  testDir: "e2e",
  forbidOnly: !!process.env.CI,
  use: {
    ...devices["Desktop Chrome"],
    // The default headless shell does not support extensions.
    channel: "chromium",
    baseURL: URL,
  },
  webServer: {
    command: "npx http-server -s -c-1 -p 8787 docs",
    url: URL,
    reuseExistingServer: false,
  },
});
