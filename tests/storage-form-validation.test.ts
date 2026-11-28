import { registerHandler, type AreaHandler } from "../ts/area-handler.js";
import { HTMLStorageFormElement } from "../ts/storage-form.js";
import type { StorageFormWriteEventDetail } from "../ts/write-event.js";
import {
  check,
  dump,
  flush,
  input,
  query,
  render,
  updateFromAnotherWindow,
} from "./helpers/dom.js";

HTMLStorageFormElement.register();

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(async () => {
  await render("");
});

describe("validation", () => {
  /** Collects the details of write events from the form. */
  function recordWrites() {
    const details: StorageFormWriteEventDetail[] = [];
    query<HTMLElement>("storage-form").addEventListener(
      "storage-form-write",
      (e) => details.push(e.detail),
    );
    return details;
  }

  it("should not store an invalid value", async () => {
    localStorage.setItem("foo", "stored");
    await render(`
      <storage-form storage-area="local-storage">
        <input name="foo" required>
      </storage-form>`);
    const writes = recordWrites();
    await input(query("input"), "");
    expect(dump(localStorage)).toEqual({ foo: "stored" });
    expect(query<HTMLInputElement>("input").value).toBe("");
    expect(writes).toEqual([{ written: [], skipped: ["foo"] }]);
  });

  it("should store an invalid value with novalidate", async () => {
    localStorage.setItem("foo", "stored");
    await render(`
      <storage-form storage-area="local-storage" novalidate>
        <input name="foo" required>
      </storage-form>`);
    expect(query<HTMLStorageFormElement>("storage-form").noValidate).toBe(true);
    await input(query("input"), "");
    expect(dump(localStorage)).toEqual({ foo: "" });
  });

  it("should reflect noValidate to the attribute", async () => {
    await render(`<storage-form></storage-form>`);
    const form = query<HTMLStorageFormElement>("storage-form");
    form.noValidate = true;
    expect(form.hasAttribute("novalidate")).toBe(true);
    form.noValidate = false;
    expect(form.hasAttribute("novalidate")).toBe(false);
  });

  it("should not delete the value by unchecking a required checkbox", async () => {
    localStorage.setItem("foo", "on");
    await render(`
      <storage-form storage-area="local-storage">
        <input type="checkbox" name="foo" required>
      </storage-form>`);
    await check(query("input"), false);
    expect(dump(localStorage)).toEqual({ foo: "on" });
  });

  it("should check the validity set by a bubbling listener on an ancestor", async () => {
    await render(`
      <storage-form storage-area="local-storage"><input name="foo"></storage-form>`);
    const e = query<HTMLInputElement>("input");
    document.body.addEventListener("input", () => {
      e.setCustomValidity(e.value === "bad" ? "bad value" : "");
    });
    await input(e, "bad");
    expect(localStorage).toHaveLength(0);
    await input(e, "good");
    expect(dump(localStorage)).toEqual({ foo: "good" });
  });

  it("should store the value even if an ancestor stops the propagation", async () => {
    await render(`
      <div><storage-form storage-area="local-storage">
        <input name="foo">
      </storage-form></div>`);
    query("div").addEventListener("input", (e) => {
      e.stopPropagation();
    });
    const e = query<HTMLInputElement>("input");
    e.value = "typed";
    e.dispatchEvent(new Event("input", { bubbles: true }));
    expect(localStorage).toHaveLength(0);
    await flush();
    expect(dump(localStorage)).toEqual({ foo: "typed" });
  });

  it("should store the value at the end of the propagation", async () => {
    await render(`
      <storage-form storage-area="local-storage"><input name="foo"></storage-form>`);
    let storedInWindowListener: string | null = "not called";
    addEventListener(
      "input",
      () => (storedInWindowListener = localStorage.getItem("foo")),
      { once: true },
    );
    const e = query<HTMLInputElement>("input");
    e.value = "typed";
    e.dispatchEvent(new Event("input", { bubbles: true }));
    expect(storedInWindowListener).toBeNull();
    expect(localStorage.getItem("foo")).toBe("typed");
  });

  it("should store a skipped value on a later edit once it is valid", async () => {
    await render(`
      <storage-form storage-area="local-storage">
        <input name="a"><input name="b">
      </storage-form>`);
    const a = query<HTMLInputElement>("[name=a]");
    const b = query<HTMLInputElement>("[name=b]");
    // a conflicts with b if they are the same
    document.body.addEventListener("input", () => {
      a.setCustomValidity(a.value === b.value ? "conflict" : "");
    });
    const writes = recordWrites();
    await input(b, "x");
    await input(a, "x");
    expect(dump(localStorage)).toEqual({ b: "x" });
    await input(b, "y");
    expect(dump(localStorage)).toEqual({ a: "x", b: "y" });
    expect(writes).toEqual([
      { written: ["b"], skipped: [] },
      { written: [], skipped: ["a"] },
      { written: ["a", "b"], skipped: [] },
    ]);
  });

  it("should forget a skipped value restored to the stored one", async () => {
    localStorage.setItem("a", "stored");
    await render(`
      <storage-form storage-area="local-storage">
        <input name="a" required><input name="b">
      </storage-form>`);
    const a = query<HTMLInputElement>("[name=a]");
    await input(a, "");
    await input(a, "stored");
    const writes = recordWrites();
    await input(query("[name=b]"), "x");
    expect(writes).toEqual([{ written: ["b"], skipped: [] }]);
  });

  it("should forget a skipped value overwritten by another window", async () => {
    localStorage.setItem("a", "stored");
    await render(`
      <storage-form storage-area="local-storage">
        <input name="a" required><input name="b">
      </storage-form>`);
    await input(query("[name=a]"), "");
    await updateFromAnotherWindow(localStorage, "a", "other");
    expect(query<HTMLInputElement>("[name=a]").value).toBe("other");
    const writes = recordWrites();
    await input(query("[name=b]"), "x");
    expect(writes).toEqual([{ written: ["b"], skipped: [] }]);
  });

  it("should not store an invalid value edited before the initial loading", async () => {
    document.body.innerHTML = `
      <storage-form storage-area="local-storage">
        <input name="foo" value="default" required>
      </storage-form>`;
    const writes = recordWrites();
    const e = query<HTMLInputElement>("input");
    e.value = "";
    e.dispatchEvent(new Event("input", { bubbles: true }));
    await flush();
    await flush();
    expect(e.value).toBe("");
    expect(localStorage).toHaveLength(0);
    expect(writes).toEqual([{ written: [], skipped: ["foo"] }]);
  });

  it("should store an edit skipped before the initial loading once it is valid", async () => {
    document.body.innerHTML = `
      <storage-form storage-area="local-storage">
        <input name="a"><input name="b">
      </storage-form>`;
    const a = query<HTMLInputElement>("[name=a]");
    a.setCustomValidity("invalid until b is edited");
    a.value = "typed";
    a.dispatchEvent(new Event("input", { bubbles: true }));
    await flush();
    expect(localStorage).toHaveLength(0);
    a.setCustomValidity("");
    await input(query("[name=b]"), "x");
    expect(dump(localStorage)).toEqual({ a: "typed", b: "x" });
  });

  it("should forget a skipped control removed from the form", async () => {
    // The other control of the same name differs from the value not stored.
    await render(`
      <storage-form storage-area="local-storage">
        <input name="a" id="a1" required><input name="a" id="a2">
        <input name="b">
      </storage-form>`);
    const a1 = query<HTMLInputElement>("#a1");
    await input(a1, "typed");
    await updateFromAnotherWindow(localStorage, "a", null);
    await input(a1, "");
    a1.remove();
    await flush();
    const writes = recordWrites();
    await input(query("[name=b]"), "x");
    expect(writes).toEqual([{ written: ["b"], skipped: [] }]);
    expect(dump(localStorage)).toEqual({ b: "x" });
  });

  it("should forget a skipped control overwritten by the value of a new area", async () => {
    sessionStorage.setItem("a", "session");
    await render(`
      <storage-form storage-area="local-storage">
        <input name="a" required><input name="b">
      </storage-form>`);
    const a = query<HTMLInputElement>("[name=a]");
    await input(a, "");
    query<HTMLStorageFormElement>("storage-form").storageArea =
      "session-storage";
    await flush();
    expect(a.value).toBe("session");
    const writes = recordWrites();
    await input(query("[name=b]"), "x");
    expect(writes).toEqual([{ written: ["b"], skipped: [] }]);
    expect(dump(sessionStorage)).toEqual({ a: "session", b: "x" });
  });

  it("should dispatch a write event after the dispatch of the edit", async () => {
    await render(`
      <storage-form storage-area="local-storage">
        <input name="foo" required>
      </storage-form>`);
    const writes = recordWrites();
    const e = query<HTMLInputElement>("input");
    e.value = "";
    e.dispatchEvent(new Event("input", { bubbles: true }));
    expect(writes).toEqual([]);
    await flush();
    expect(writes).toEqual([{ written: [], skipped: ["foo"] }]);
  });

  it("should dispatch a write event with the error of a rejected write", async () => {
    const error = jest.spyOn(console, "error").mockImplementation();
    registerHandler("always-rejecting", {
      read: () => Promise.resolve(new Map()),
      write: () => Promise.reject(Error("write rejected")),
      onChange: () => ({ stop: () => true }),
    } as unknown as AreaHandler);
    await render(`
      <storage-form storage-area="always-rejecting"><input name="foo"></storage-form>`);
    const writes = recordWrites();
    await input(query("input"), "typed");
    expect(writes).toEqual([
      { written: [], skipped: [], error: Error("write rejected") },
    ]);
    expect(error).toHaveBeenCalledWith(Error("write rejected"));
  });
});

describe("validation edge cases", () => {
  it("should bubble the write event to the document", async () => {
    await render(`
      <storage-form storage-area="local-storage"><input name="foo"></storage-form>`);
    const details: StorageFormWriteEventDetail[] = [];
    const listener = (e: Event) =>
      details.push((e as CustomEvent<StorageFormWriteEventDetail>).detail);
    document.addEventListener("storage-form-write", listener);
    await input(query("input"), "typed");
    document.removeEventListener("storage-form-write", listener);
    expect(details).toEqual([{ written: ["foo"], skipped: [] }]);
  });

  it("should not access the storage if all edits are skipped", async () => {
    localStorage.setItem("foo", "stored");
    await render(`
      <storage-form storage-area="local-storage">
        <input name="foo" required>
      </storage-form>`);
    const getItem = jest.spyOn(Storage.prototype, "getItem");
    const setItem = jest.spyOn(Storage.prototype, "setItem");
    await input(query("input"), "");
    await flush();
    expect(getItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });

  it("should store an edit even if a listener on an ancestor removes the form", async () => {
    await render(`
      <div><storage-form storage-area="local-storage">
        <input name="foo">
      </storage-form></div>`);
    document.body.addEventListener(
      "input",
      () => {
        query("storage-form").remove();
      },
      { once: true },
    );
    await input(query("input"), "typed");
    expect(dump(localStorage)).toEqual({ foo: "typed" });
  });

  it("should store an edit even if the form is removed after the propagation is stopped", async () => {
    await render(`
      <div><storage-form storage-area="local-storage">
        <input name="foo">
      </storage-form></div>`);
    query("div").addEventListener("input", (e) => {
      e.stopPropagation();
    });
    const e = query<HTMLInputElement>("input");
    e.value = "typed";
    e.dispatchEvent(new Event("input", { bubbles: true }));
    query("storage-form").remove();
    await flush();
    expect(dump(localStorage)).toEqual({ foo: "typed" });
  });

  it("should keep a skipped control when another control of the name is removed", async () => {
    localStorage.setItem("a", "stored");
    await render(`
      <storage-form storage-area="local-storage">
        <input name="a" id="a1" required><input name="a" id="a2">
        <input name="b">
      </storage-form>`);
    await input(query("#a1"), "");
    query("#a2").remove();
    await flush();
    const details: StorageFormWriteEventDetail[] = [];
    query<HTMLElement>("storage-form").addEventListener(
      "storage-form-write",
      (e) => details.push(e.detail),
    );
    await input(query("[name=b]"), "x");
    expect(details).toEqual([{ written: ["b"], skipped: ["a"] }]);
  });

  it("should not report an unchanged edit before the initial loading", async () => {
    document.body.innerHTML = `
      <storage-form storage-area="local-storage">
        <input type="checkbox" name="foo" required>
      </storage-form>`;
    const details: StorageFormWriteEventDetail[] = [];
    query<HTMLElement>("storage-form").addEventListener(
      "storage-form-write",
      (e) => details.push(e.detail),
    );
    query("input").dispatchEvent(new Event("change", { bubbles: true }));
    await flush();
    await flush();
    expect(details).toEqual([]);
    expect(localStorage).toHaveLength(0);
  });
});
