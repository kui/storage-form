import { test as base, chromium, expect } from "@playwright/test";
import { cp } from "node:fs/promises";

const test = base.extend<{ optionsUrl: string }>({
  // Extensions are available only in a persistent context.
  context: async ({ channel }, use, testInfo) => {
    const extension = testInfo.outputPath("extension");
    await cp("e2e/extension", extension, { recursive: true });
    await cp("js", `${extension}/js`, { recursive: true });

    const context = await chromium.launchPersistentContext(
      testInfo.outputPath("profile"),
      {
        ...(channel && { channel }),
        args: [
          `--disable-extensions-except=${extension}`,
          `--load-extension=${extension}`,
        ],
      },
    );
    await use(context);
    await context.close();
  },
  optionsUrl: async ({ context }, use) => {
    const worker =
      context.serviceWorkers().at(0) ??
      (await context.waitForEvent("serviceworker"));
    await use(new URL("options.html", worker.url()).href);
  },
});

for (const area of ["local", "sync"] as const) {
  test(`should store into and restore from chrome.storage.${area}`, async ({
    page,
    optionsUrl,
  }) => {
    const stored = () =>
      page.evaluate((area) => chrome.storage[area].get(), area);
    const form = page.locator(`storage-form[storage-area=chrome-${area}]`);
    const text = form.locator("[name=text]");
    const checkbox = form.locator("[name=checkbox]");

    await page.goto(optionsUrl);
    await text.fill("typed");
    await checkbox.check();
    await expect.poll(stored).toEqual({ text: "typed", checkbox: "on" });

    await page.reload();
    await expect(text).toHaveValue("typed");
    await expect(checkbox).toBeChecked();

    await checkbox.uncheck();
    await expect.poll(stored).toEqual({ text: "typed" });

    // Changes by others, such as another tab and a synchronized browser
    await page.evaluate(
      (area) => chrome.storage[area].set({ text: "updated" }),
      area,
    );
    await expect(text).toHaveValue("updated");
  });
}
