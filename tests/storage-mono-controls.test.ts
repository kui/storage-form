import { registerHandler, type AreaHandler } from "../ts/area-handler.js";
import type { StoredValues, WroteValues } from "../ts/globals.js";
import {
  HTMLStorageInputElement,
  HTMLStorageOutputElement,
  HTMLStorageSelectElement,
  HTMLStorageTextAreaElement,
} from "../ts/storage-mono-controls.js";
import {
  check,
  dump,
  flush,
  input,
  query,
  render,
  updateFromAnotherWindow,
} from "./helpers/dom.js";

HTMLStorageInputElement.register();
HTMLStorageSelectElement.register();
HTMLStorageTextAreaElement.register();
HTMLStorageOutputElement.register();

/** An area whose reads are completed manually. */
class ManualArea {
  readonly values = new Map<string, string>();
  private reads: (() => void)[] = [];
  private listeners: ((updates: WroteValues) => void | Promise<void>)[] = [];

  constructor(name: string) {
    const handler: AreaHandler = {
      read: (names) =>
        new Promise<StoredValues>((resolve) => {
          const entries = [...this.values].filter(([k]) => names.includes(k));
          this.reads.push(() => {
            resolve(new Map(entries));
          });
        }),
      write: (items) => {
        for (const [k, v] of items) {
          if (v === undefined) this.values.delete(k);
          else this.values.set(k, v);
        }
      },
      readBytes: () => new Map(),
      readTotalBytes: () => 0,
      quotaBytes: undefined,
      totalQuotaBytes: undefined,
      onChange: (callback) => {
        this.listeners.push(callback);
        return {
          stop: () => {
            this.listeners = this.listeners.filter((l) => l !== callback);
          },
        };
      },
    };
    registerHandler(name, handler);
  }

  reset() {
    this.values.clear();
    this.reads = [];
    this.listeners = [];
  }

  async completeReads() {
    for (const complete of this.reads.splice(0)) complete();
    await flush();
  }

  async updateFromAnotherWindow(key: string, value: string) {
    this.values.set(key, value);
    for (const l of this.listeners) void l(new Map([[key, value]]));
    await flush();
  }
}

const manual = new ManualArea("manual");
const manual2 = new ManualArea("manual2");

beforeEach(() => {
  manual.reset();
  manual2.reset();
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(async () => {
  await render("");
});

describe.each([
  ["storage-input", `<input is="storage-input" $>`],
  [
    "storage-select",
    `<select is="storage-select" $><option>a<option>b</select>`,
  ],
  ["storage-textarea", `<textarea is="storage-textarea" $></textarea>`],
  ["storage-output", `<output is="storage-output" $></output>`],
])("%s", (_, template) => {
  const html = template.replace("$", `name="foo" storage-area="local-storage"`);
  const target = () => query<HTMLInputElement>("[name=foo]");

  it("should load the stored value", async () => {
    localStorage.setItem("foo", "b");
    await render(html);
    expect(target().value).toBe("b");
  });

  it("should store the value", async () => {
    await render(html);
    await input(target(), "b");
    expect(localStorage.getItem("foo")).toBe("b");
  });

  it("should follow changes by another window", async () => {
    await render(html);
    const listener = jest.fn();
    target().addEventListener("change", listener);
    await updateFromAnotherWindow(localStorage, "foo", "b");
    expect(target().value).toBe("b");
    expect(listener).toHaveBeenCalledTimes(1);
    await updateFromAnotherWindow(localStorage, "bar", "a");
    expect(target().value).toBe("b");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("should stop after disconnected", async () => {
    await render(html);
    const e = target();
    e.remove();
    await input(e, "b");
    expect(localStorage.getItem("foo")).toBeNull();
    const before = e.value;
    await updateFromAnotherWindow(localStorage, "foo", "a");
    expect(e.value).toBe(before);
  });
});

describe("storage-input", () => {
  const html = `<input is="storage-input" name="foo" storage-area="local-storage">`;
  const target = () => query<HTMLStorageInputElement>("input");

  it("should not write before the initial loading", async () => {
    localStorage.setItem("foo", "stored");
    document.body.innerHTML = html;
    target().value = "typed";
    target().dispatchEvent(new Event("input", { bubbles: true }));
    await flush();
    expect(localStorage.getItem("foo")).toBe("stored");
    expect(target().value).toBe("stored");
  });

  it.each([
    `name="foo" storage-area="local-storage"`,
    `storage-area="local-storage" name="foo"`,
    `value="default" name="foo" storage-area="local-storage"`,
    `name="foo" storage-area="local-storage" value="default"`,
  ])("should load only the stored value: %s", async (attrs) => {
    localStorage.setItem("foo", "stored");
    const listener = jest.fn();
    document.body.addEventListener("change", listener);
    const setItem = jest.spyOn(Storage.prototype, "setItem");
    document.body.innerHTML = `<input is="storage-input" ${attrs}>`;
    target().value = "typed before loading";
    await flush();
    document.body.removeEventListener("change", listener);
    expect(target().value).toBe("stored");
    expect(setItem).not.toHaveBeenCalled();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("should not load before connected", async () => {
    localStorage.setItem("foo", "stored");
    const e = document.createElement("input", { is: "storage-input" });
    e.name = "foo";
    e.setAttribute("storage-area", "local-storage");
    await flush();
    e.setAttribute("value", "attr");
    await flush();
    expect(e.value).toBe("attr");
    expect(localStorage.getItem("foo")).toBe("stored");

    document.body.append(e);
    await flush();
    expect(e.value).toBe("stored");
    await input(e, "typed");
    expect(localStorage.getItem("foo")).toBe("typed");
  });

  it("should reload after reconnected", async () => {
    localStorage.setItem("foo", "stored");
    await render(html);
    const e = target();
    e.remove();
    localStorage.setItem("foo", "changed");
    e.defaultValue = "attr";
    await flush();
    expect(localStorage.getItem("foo")).toBe("changed");
    document.body.append(e);
    await input(e, "typed before loading");
    expect(e.value).toBe("changed");
    expect(localStorage.getItem("foo")).toBe("changed");
    await input(e, "typed");
    expect(localStorage.getItem("foo")).toBe("typed");
  });

  it("should reload after moved to another document", async () => {
    localStorage.setItem("foo", "stored");
    await render(html);
    const e = target();
    const another = document.implementation.createHTMLDocument();
    another.adoptNode(e);
    localStorage.setItem("foo", "changed");
    await flush();
    expect(e.value).toBe("stored");
    another.body.append(e);
    await flush();
    expect(e.value).toBe("changed");
    await input(e, "typed");
    e.remove();
    expect(localStorage.getItem("foo")).toBe("typed");
  });

  it("should load when the storage-area is added later", async () => {
    localStorage.setItem("foo", "stored");
    await render(`<input is="storage-input" name="foo">`);
    await input(target(), "typed without area");
    expect(target().value).toBe("typed without area");
    target().storageArea = "local-storage";
    await input(target(), "typed before loading");
    expect(target().value).toBe("stored");
    expect(localStorage.getItem("foo")).toBe("stored");
    await input(target(), "typed");
    expect(localStorage.getItem("foo")).toBe("typed");
  });

  it("should keep the value when the storage-area is removed", async () => {
    localStorage.setItem("foo", "stored");
    await render(html);
    target().removeAttribute("storage-area");
    await flush();
    expect(target().value).toBe("stored");
    await input(target(), "typed");
    expect(localStorage.getItem("foo")).toBe("stored");
  });

  it.each([
    ["name", "bar"],
    ["storage-area", "session-storage"],
  ])("should not write just after the %s change", async (attr, value) => {
    localStorage.setItem("foo", "old");
    localStorage.setItem("bar", "new");
    sessionStorage.setItem("foo", "new");
    await render(html);
    target().setAttribute(attr, value);
    await input(target(), "typed");
    expect(target().value).toBe("new");
    expect(dump(localStorage)).toEqual({ foo: "old", bar: "new" });
    expect(dump(sessionStorage)).toEqual({ foo: "new" });
  });

  it.each([
    ["name", "foo"],
    ["storage-area", "local-storage"],
  ])("should store the value typed with the same %s", async (attr, value) => {
    localStorage.setItem("foo", "stored");
    await render(html);
    const e = target();
    e.addEventListener(
      "input",
      () => {
        e.setAttribute(attr, value);
      },
      { capture: true },
    );
    await input(e, "typed");
    expect(e.value).toBe("typed");
    expect(localStorage.getItem("foo")).toBe("typed");
  });

  it.each([
    ["name", "foo"],
    ["storage-area", "manual"],
  ])(
    "should store the values typed while reloading by the same %s",
    async (attr, value) => {
      manual.values.set("foo", "stored");
      await render(
        `<input is="storage-input" name="foo" storage-area="manual">`,
      );
      await manual.completeReads();
      const e = target();
      e.setAttribute(attr, value);
      await input(e, "typed");
      expect(manual.values.get("foo")).toBe("typed");
      e.setAttribute(attr, value);
      await manual.completeReads();
      // The change must be known before the second reload is completed.
      await input(e, "stored");
      expect(manual.values.get("foo")).toBe("stored");
      await manual.completeReads();
      await manual.completeReads();
      expect(e.value).toBe("stored");
      expect(manual.values.get("foo")).toBe("stored");
    },
  );

  it("should ignore the old area while loading the new area", async () => {
    manual.values.set("foo", "old");
    manual2.values.set("foo", "new");
    await render(`<input is="storage-input" name="foo" storage-area="manual">`);
    await manual.updateFromAnotherWindow("foo", "old2");
    target().storageArea = "manual2";
    await manual.completeReads();
    expect(target().value).toBe("");
    await input(target(), "typed before loading");
    expect(manual2.values.get("foo")).toBe("new");
    await manual2.completeReads();
    expect(target().value).toBe("new");
    expect(manual.values.get("foo")).toBe("old2");
    expect(manual2.values.get("foo")).toBe("new");
  });

  it("should apply changes made while loading", async () => {
    manual.values.set("foo", "old");
    await render(`<input is="storage-input" name="foo" storage-area="manual">`);
    await manual.updateFromAnotherWindow("foo", "new");
    await manual.completeReads();
    expect(target().value).toBe("new");
  });

  it("should ignore the loading after disconnected", async () => {
    manual.values.set("foo", "stored");
    await render(`<input is="storage-input" name="foo" storage-area="manual">`);
    const e = target();
    e.remove();
    await manual.completeReads();
    expect(e.value).toBe("");
    manual.values.set("foo", "changed");
    document.body.append(e);
    await flush();
    await manual.completeReads();
    expect(e.value).toBe("changed");
  });

  it("should ignore the loading before reconnected", async () => {
    manual.values.set("foo", "stored");
    await render(`<input is="storage-input" name="foo" storage-area="manual">`);
    const e = target();
    e.remove();
    manual.values.set("foo", "changed");
    document.body.append(e);
    await manual.completeReads();
    expect(e.value).toBe("");
    await manual.completeReads();
    expect(e.value).toBe("changed");
  });

  it("should not write unchanged values", async () => {
    localStorage.setItem("foo", "stored");
    await render(html);
    const setItem = jest.spyOn(Storage.prototype, "setItem");
    await input(target(), "stored");
    expect(setItem).not.toHaveBeenCalled();
  });

  it("should delete the value if a checkbox is unchecked", async () => {
    localStorage.setItem("foo", "on");
    await render(html.replace("<input", `<input type="checkbox"`));
    expect(target().checked).toBe(true);
    await check(target(), false);
    expect(localStorage.getItem("foo")).toBeNull();
  });

  it("should follow the name change", async () => {
    localStorage.setItem("foo", "foo value");
    localStorage.setItem("bar", "bar value");
    await render(html);
    target().name = "bar";
    await flush();
    expect(target().value).toBe("bar value");
    await input(target(), "typed");
    expect(dump(localStorage)).toEqual({ foo: "foo value", bar: "typed" });
  });

  it("should follow the storage-area change", async () => {
    localStorage.setItem("foo", "local");
    sessionStorage.setItem("foo", "session");
    await render(html);
    target().storageArea = "session-storage";
    await flush();
    expect(target().value).toBe("session");
    await input(target(), "typed");
    expect(localStorage.getItem("foo")).toBe("local");
    expect(sessionStorage.getItem("foo")).toBe("typed");
  });

  // https://github.com/kui/storage-form/issues/41
  it("should not store the value changed by the value attribute", async () => {
    await render(html);
    target().setAttribute("value", "attr");
    await flush();
    expect(localStorage.getItem("foo")).toBeNull();
  });

  it("should not overwrite the stored value by the value attribute", async () => {
    localStorage.setItem("foo", "stored");
    await render(html);
    target().setAttribute("value", "attr");
    await flush();
    expect(localStorage.getItem("foo")).toBe("stored");
    expect(target().value).toBe("stored");
  });

  it.each(["radio", "checkbox"])(
    "should store the value changed by the value attribute of %s",
    async (type) => {
      localStorage.setItem("foo", "a");
      await render(html.replace("<input", `<input type="${type}" value="a"`));
      expect(target().checked).toBe(true);
      target().setAttribute("value", "b");
      await flush();
      expect(localStorage.getItem("foo")).toBe("b");
    },
  );

  it("should synchronize with other elements", async () => {
    await render(
      `${html}<textarea is="storage-textarea" name="foo" storage-area="local-storage"></textarea>`,
    );
    await input(target(), "typed");
    expect(query<HTMLTextAreaElement>("textarea").value).toBe("typed");
  });
});
