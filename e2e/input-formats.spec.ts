import { expect, test, type Page } from "@playwright/test";

const KEY = "key";

async function open(page: Page, attrs: string, stored: string | null) {
  await page.route("**/input-formats.html", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html>
        <script type="module">
          import { register } from "./js/storage-elements-registerer.js";
          if (${JSON.stringify(stored)} !== null)
            localStorage.setItem("${KEY}", ${JSON.stringify(stored)});
          register();
        </script>
        <storage-form storage-area="local-storage">
          <input name="${KEY}" ${attrs}>
          <input name="ready">
        </storage-form>
        <input is="storage-input" storage-area="local-storage" name="${KEY}" ${attrs}>`,
    }),
  );
  await page.goto("/input-formats.html");
}

const formInput = (page: Page) => page.locator("storage-form input").first();
const monoInput = (page: Page) => page.locator("input[is=storage-input]");
const stored = (page: Page) =>
  page.evaluate((key) => localStorage.getItem(key), KEY);

// Changing another control makes the form write all the changed controls.
async function changeAnotherControl(page: Page) {
  const ready = page.locator("[name=ready]");
  await expect(async () => {
    await ready.fill("");
    await ready.fill("ready");
    expect(await page.evaluate(() => localStorage.getItem("ready"))).toBe(
      "ready",
    );
  }).toPass();
}

for (const [type, value] of [
  ["date", "2020-01-02"],
  ["date", "12020-01-02"],
  ["datetime-local", "2020-01-02T03:04"],
  ["datetime-local", "2020-01-02T03:04:05"],
  ["datetime-local", "2020-01-02T03:04:05.678"],
  ["datetime-local", "12020-01-02T03:04"],
  ["month", "2020-01"],
  ["month", "12020-01"],
  ["time", "03:04"],
  ["time", "03:04:05"],
  ["time", "03:04:05.678"],
  ["week", "2020-W53"],
  ["week", "12020-W01"],
  ["number", "1e5"],
  ["number", ".5"],
  ["number", "-.5"],
  ["range", "20"],
  ["color", "#aabbcc"],
] as const) {
  test(`should restore type=${type} value=${value}`, async ({ page }) => {
    await open(page, `type=${type} step=any`, value);
    await expect(formInput(page)).toHaveValue(value);
    await expect(monoInput(page)).toHaveValue(value);
    await changeAnotherControl(page);
    expect(await stored(page)).toBe(value);
  });
}

for (const [type, value, sanitized] of [
  ["date", "invalid", ""],
  ["datetime-local", "2020-01-02T03:04:00", "2020-01-02T03:04"],
  ["datetime-local", "2020-01-02 03:04", "2020-01-02T03:04"],
  ["number", "+20", ""],
  ["number", "invalid", ""],
  ["range", "1e1", "10"],
  ["range", "+20", "50"],
  ["range", "200", "100"],
  ["range", "", "50"],
  ["color", "red", "#ff0000"],
  ["color", "invalid", "#000000"],
] as const) {
  test(`should not overwrite the stored value by loading type=${type} value=${value}`, async ({
    page,
  }) => {
    await open(page, `type=${type}`, value);
    await expect(formInput(page)).toHaveValue(sanitized);
    await expect(monoInput(page)).toHaveValue(sanitized);
    await changeAnotherControl(page);
    expect(await stored(page)).toBe(value);
  });
}

test("should keep seconds entered by the user after reload", async ({
  page,
}) => {
  await open(page, "type=time step=1", null);
  await expect(async () => {
    await formInput(page).fill("03:04:05");
    expect(await stored(page)).toBe("03:04:05");
  }).toPass();
  await page.reload();
  await expect(formInput(page)).toHaveValue("03:04:05");
  await expect(monoInput(page)).toHaveValue("03:04:05");
});

test("should store a value changed by the user over a sanitized one", async ({
  page,
}) => {
  await open(page, "type=datetime-local", "2020-01-02T03:04:00");
  await changeAnotherControl(page);
  await formInput(page).fill("2021-12-31T23:59");
  await expect.poll(() => stored(page)).toBe("2021-12-31T23:59");
  await expect(monoInput(page)).toHaveValue("2021-12-31T23:59");
});
