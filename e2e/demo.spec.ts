import { expect, test, type Page } from "@playwright/test";

const textInput = (page: Page) =>
  page.locator("storage-form input[name=foo]").first();
const monoInput = (page: Page) =>
  page.locator("input[is=storage-input][name=foo]");

test("should restore the value after reload without errors", async ({
  page,
}) => {
  const errors: unknown[] = [];
  page.on("pageerror", (e) => errors.push(e));
  page.on("console", (m) => {
    // The favicon does not exist.
    if (m.type() === "error" && !m.location().url.endsWith("/favicon.ico"))
      errors.push(m.text());
  });

  await page.goto("/");
  await textInput(page).fill("typed");
  await expect(monoInput(page)).toHaveValue("typed");

  await page.reload();
  await expect(textInput(page)).toHaveValue("typed");
  await expect(monoInput(page)).toHaveValue("typed");
  expect(errors).toEqual([]);
});

test("should synchronize between tabs", async ({ context }) => {
  const a = await context.newPage();
  const b = await context.newPage();
  await a.goto("/");
  await b.goto("/");

  await textInput(a).fill("from a");
  await expect(textInput(b)).toHaveValue("from a");
  await expect(monoInput(b)).toHaveValue("from a");

  await monoInput(b).fill("from b");
  await expect(textInput(a)).toHaveValue("from b");
});
