import { expect, test, type Page } from "@playwright/test";

interface Write {
  written: string[];
  skipped: string[];
}

/**
 * Records the details of the write events, and returns a function which runs
 * an action and waits for a write after it that matches. Moving the focus also
 * dispatches change events and writes, so the order of the writes is not
 * checked.
 */
async function recordWrites(page: Page) {
  await page.evaluate(() => {
    const writes: Write[] = [];
    Object.assign(window, { writes });
    document.addEventListener("storage-form-write", (e) => {
      const { written, skipped } = e.detail;
      writes.push({ written, skipped });
    });
  });
  const matches = (actual: string[], names: string[] | undefined) =>
    names === undefined ||
    (actual.length === names.length && names.every((n) => actual.includes(n)));
  return async (action: () => Promise<void>, expected: Partial<Write>) => {
    // Writes of the previous actions must not match.
    await page.evaluate(() => {
      (window as unknown as { writes: Write[] }).writes.length = 0;
    });
    await action();
    await expect
      .poll(async () => {
        const writes = await page.evaluate(
          () => (window as unknown as { writes: Write[] }).writes,
        );
        return writes.some(
          (w) =>
            matches(w.written, expected.written) &&
            matches(w.skipped, expected.skipped),
        );
      })
      .toBe(true);
  };
}

const stored = (page: Page, key: string) =>
  page.evaluate((k) => localStorage.getItem(k), key);

const control = (page: Page, name: string) =>
  page.locator(`storage-form input[name=${name}]`);

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload();
});

test("should not store invalid values, and store the others", async ({
  page,
}) => {
  const required = control(page, "validation-required");
  const pattern = control(page, "validation-pattern");
  const expectWrite = await recordWrites(page);
  await expectWrite(() => required.fill("valid"), {
    written: ["validation-required"],
  });

  await expectWrite(() => required.fill(""), {
    written: [],
    skipped: ["validation-required"],
  });
  await expectWrite(() => pattern.fill("abc"), {
    written: ["validation-pattern"],
  });
  expect(await stored(page, "validation-required")).toBe("valid");
  expect(await stored(page, "validation-pattern")).toBe("abc");

  // The invalid value skipped before is checked again.
  await expectWrite(() => pattern.fill("ABC"), {
    written: [],
    skipped: ["validation-required", "validation-pattern"],
  });
  expect(await stored(page, "validation-pattern")).toBe("abc");
});

test("should check the custom validity set by a listener outside the form", async ({
  page,
}) => {
  const primary = control(page, "validation-primary");
  const secondary = control(page, "validation-secondary");
  const expectWrite = await recordWrites(page);
  await expectWrite(() => primary.fill("x"), {
    written: ["validation-primary"],
  });
  await expectWrite(() => secondary.fill("y"), {
    written: ["validation-secondary"],
  });

  await expectWrite(() => secondary.fill("x"), {
    written: [],
    skipped: ["validation-secondary"],
  });
  await expect(page.locator("#validation-message")).toHaveText(
    "Same as the primary key",
  );
  await expect(page.locator("#validation-log")).toHaveText(
    "written: [], skipped: [validation-secondary]",
  );
  expect(await stored(page, "validation-secondary")).toBe("y");

  // Fixing the conflict stores the skipped value too.
  await expectWrite(() => primary.fill("z"), {
    written: ["validation-primary", "validation-secondary"],
    skipped: [],
  });
  await expect(page.locator("#validation-message")).toHaveText("");
  expect(await stored(page, "validation-primary")).toBe("z");
  expect(await stored(page, "validation-secondary")).toBe("x");
});

test("should write after the listeners on the window", async ({ page }) => {
  await page.evaluate(() => {
    addEventListener("input", () => {
      Object.assign(window, {
        storedInListener: localStorage.getItem("validation-pattern"),
      });
    });
  });
  const expectWrite = await recordWrites(page);
  await expectWrite(
    () => control(page, "validation-pattern").pressSequentially("a"),
    { written: ["validation-pattern"] },
  );
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { storedInListener: unknown }).storedInListener,
    ),
  ).toBeNull();
  expect(await stored(page, "validation-pattern")).toBe("a");
});

test("should store an invalid value with novalidate", async ({ page }) => {
  const novalidate = control(page, "validation-novalidate");
  const expectWrite = await recordWrites(page);
  await expectWrite(() => novalidate.fill("typed"), {
    written: ["validation-novalidate"],
  });
  await expectWrite(() => novalidate.fill(""), {
    written: ["validation-novalidate"],
    skipped: [],
  });
  expect(await stored(page, "validation-novalidate")).toBe("");
});
