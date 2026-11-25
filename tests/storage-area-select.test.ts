import type { StorageElementMixin } from "../ts/elements.js";
import { allCustomElementsDefinedEvent } from "../ts/globals.js";
import {
  HTMLAreaSelectElement,
  HTMLStorageAreaSelectElement,
} from "../ts/storage-area-select.js";
import { HTMLStorageFormElement } from "../ts/storage-form.js";
import { flush, input, query, render } from "./helpers/dom.js";

HTMLAreaSelectElement.register();
HTMLStorageAreaSelectElement.register();
HTMLStorageFormElement.register();

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(async () => {
  await render("");
});

const form = () => query<HTMLStorageFormElement>("storage-form");
type AreaSelect = HTMLAreaSelectElement & {
  target: StorageElementMixin | null;
};
const select = () => query<AreaSelect>("select");

describe("area-select", () => {
  it("should have options of all areas by default", async () => {
    await render(`<select is="area-select"></select>`);
    expect([...select().options].map((o) => [o.value, o.text])).toEqual([
      ["local-storage", "local-storage"],
      ["session-storage", "session-storage"],
    ]);
  });

  it("should keep existing options", async () => {
    await render(`<select is="area-select"><option>session-storage</select>`);
    expect([...select().options].map((o) => o.value)).toEqual([
      "session-storage",
    ]);
  });

  it("should update the area of the ancestor form", async () => {
    await render(`
      <storage-form>
        <div><select is="area-select"></select></div>
        <input name="foo">
      </storage-form>`);
    expect(form().storageArea).toBe("local-storage");
    await input(select(), "session-storage");
    expect(form().storageArea).toBe("session-storage");
    await input(query("input"), "typed");
    expect(localStorage).toHaveLength(0);
    expect(sessionStorage.getItem("foo")).toBe("typed");
  });

  it("should find the form beyond the shadow root", async () => {
    await render(`<storage-form><div></div></storage-form>`);
    query("div").attachShadow({ mode: "open" }).innerHTML =
      `<select is="area-select"></select>`;
    await flush();
    expect(form().storageArea).toBe("local-storage");
  });

  it("should prefer the target property", async () => {
    await render(`
      <storage-form id="ancestor"><select is="area-select"></select></storage-form>
      <storage-form id="other"></storage-form>`);
    const other = query<HTMLStorageFormElement>("#other");
    expect(select().target).toBe(query("#ancestor"));
    select().target = other;
    await input(select(), "session-storage");
    expect(other.storageArea).toBe("session-storage");
    expect(query<HTMLStorageFormElement>("#ancestor").storageArea).toBe(
      "local-storage",
    );
  });

  it("should do nothing without the target", async () => {
    await render(`<div><select is="area-select"></select></div>`);
    expect(select().target).toBeNull();
    await input(select(), "session-storage");
    expect(document.querySelector("[storage-area]")).toBeNull();
  });

  it("should update the target after all elements are defined", async () => {
    await render(
      `<storage-form><select is="area-select"></select></storage-form>`,
    );
    form().removeAttribute("storage-area");
    allCustomElementsDefinedEvent.dispatchEvent();
    expect(form().storageArea).toBe("local-storage");
  });

  it("should stop after disconnected", async () => {
    await render(
      `<storage-form><select is="area-select"></select></storage-form>`,
    );
    const e = select();
    e.target = form();
    e.remove();
    await input(e, "session-storage");
    expect(form().storageArea).toBe("local-storage");
  });

  it("should not update the target by the definition after disconnected", async () => {
    await render(
      `<storage-form><select is="area-select"></select></storage-form>`,
    );
    const e = select();
    e.target = form();
    e.remove();
    form().removeAttribute("storage-area");
    allCustomElementsDefinedEvent.dispatchEvent();
    expect(form().hasAttribute("storage-area")).toBe(false);

    form().append(e);
    form().removeAttribute("storage-area");
    allCustomElementsDefinedEvent.dispatchEvent();
    expect(form().storageArea).toBe("local-storage");
  });

  it("should not leave listeners after disconnected", async () => {
    await render(`<select is="area-select"></select>`);
    const { size } = allCustomElementsDefinedEvent.listeners;
    const e = select();
    for (let i = 0; i < 5; i++) {
      e.remove();
      expect(allCustomElementsDefinedEvent.listeners.size).toBe(size - 1);
      document.body.append(e);
      expect(allCustomElementsDefinedEvent.listeners.size).toBe(size);
    }
  });

  it("should not be stored by the ancestor form", async () => {
    await render(`
      <storage-form><select is="area-select" name="area"></select></storage-form>`);
    await input(select(), "session-storage");
    expect(localStorage).toHaveLength(0);
    expect(sessionStorage).toHaveLength(0);
  });
});

describe("storage-area-select", () => {
  const html = `
    <storage-form>
      <select is="storage-area-select" name="area" storage-area="local-storage"></select>
      <input name="foo">
    </storage-form>`;

  // https://github.com/kui/storage-form/issues/40
  it.failing("should restore the stored area", async () => {
    localStorage.setItem("area", "session-storage");
    sessionStorage.setItem("foo", "stored");
    await render(html);
    expect(select().value).toBe("session-storage");
    expect(form().storageArea).toBe("session-storage");
    await flush();
    expect(query<HTMLInputElement>("input").value).toBe("stored");
  });

  it("should store the selected area", async () => {
    await render(html);
    await input(select(), "session-storage");
    expect(localStorage.getItem("area")).toBe("session-storage");
    expect(form().storageArea).toBe("session-storage");
  });
});
