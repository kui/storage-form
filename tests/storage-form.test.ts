import {
  BufferedWriteHandler,
  registerHandler,
  WebStorageHandler,
  type AreaHandler,
} from "../ts/area-handler.js";
import { withResolves } from "../ts/promises.js";
import { HTMLStorageFormElement } from "../ts/storage-form.js";
import { HTMLStorageInputElement } from "../ts/storage-mono-controls.js";
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
HTMLStorageFormElement.register();

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(async () => {
  await render("");
});

describe("initialization", () => {
  it("should load the stored value", async () => {
    localStorage.setItem("foo", "stored");
    await render(`
      <storage-form storage-area="local-storage">
        <div><input name="foo" value="default"></div>
      </storage-form>`);
    expect(query<HTMLInputElement>("input").value).toBe("stored");
  });

  it("should store the default value if there is no stored value", async () => {
    await render(`
      <storage-form storage-area="local-storage">
        <input name="foo" value="default">
      </storage-form>`);
    await input(query("input"), "default");
    expect(localStorage.getItem("foo")).toBe("default");
  });

  it("should not write before the initial loading", async () => {
    localStorage.setItem("foo", "stored");
    document.body.innerHTML = `
      <storage-form storage-area="local-storage"><input name="foo"></storage-form>`;
    const e = query<HTMLInputElement>("input");
    e.value = "typed";
    e.dispatchEvent(new Event("input", { bubbles: true }));
    expect(localStorage.getItem("foo")).toBe("stored");
    await flush();
    expect(e.value).toBe("stored");
    expect(localStorage.getItem("foo")).toBe("stored");
  });

  it("should not manage storage-input elements added with the form", async () => {
    localStorage.setItem("foo", "local");
    sessionStorage.setItem("foo", "session");
    await render(`
      <storage-form storage-area="local-storage">
        <input is="storage-input" storage-area="session-storage" name="foo">
        <input name="foo">
      </storage-form>`);
    const [mono, control] = Array.from(
      document.querySelectorAll<HTMLInputElement>("input"),
    );
    expect(mono.value).toBe("session");
    expect(control.value).toBe("local");
  });

  it("should dispatch a change event if the value is changed", async () => {
    localStorage.setItem("foo", "stored");
    const listener = jest.fn();
    document.body.addEventListener("change", listener);
    await render(`
      <storage-form storage-area="local-storage">
        <input name="foo">
        <input name="bar">
      </storage-form>`);
    document.body.removeEventListener("change", listener);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("should ignore elements without name and unsupported elements", async () => {
    localStorage.setItem("foo", "stored");
    await render(`
      <storage-form storage-area="local-storage">
        <input value="default">
        <button name="foo" value="default"></button>
      </storage-form>`);
    await input(query("input"), "typed");
    expect(query<HTMLButtonElement>("button").value).toBe("default");
    expect(dump(localStorage)).toEqual({ foo: "stored" });
  });

  it("should do nothing without storage-area", async () => {
    await render(`<storage-form><input name="foo"></storage-form>`);
    await input(query("input"), "typed");
    expect(localStorage).toHaveLength(0);
    expect(sessionStorage).toHaveLength(0);
  });
});

describe("writing", () => {
  it.each(["input", "change"])("should store on %s event", async (type) => {
    await render(`
      <storage-form storage-area="local-storage"><input name="foo"></storage-form>`);
    const e = query<HTMLInputElement>("input");
    e.value = "typed";
    e.dispatchEvent(new Event(type, { bubbles: true }));
    await flush();
    expect(localStorage.getItem("foo")).toBe("typed");
  });

  it("should store values of textarea and select", async () => {
    await render(`
      <storage-form storage-area="local-storage">
        <textarea name="text"></textarea>
        <select name="select"><option>a<option>b</select>
      </storage-form>`);
    await input(query("textarea"), "typed");
    await input(query("select"), "b");
    expect(dump(localStorage)).toEqual({ text: "typed", select: "b" });
  });

  it("should store and delete by a checkbox", async () => {
    await render(`
      <storage-form storage-area="local-storage">
        <input type="checkbox" name="foo">
      </storage-form>`);
    await check(query("input"), true);
    expect(localStorage.getItem("foo")).toBe("on");
    await check(query("input"), false);
    expect(localStorage.getItem("foo")).toBeNull();
  });

  it("should store the selected radio", async () => {
    localStorage.setItem("foo", "a");
    await render(`
      <storage-form storage-area="local-storage">
        <input type="radio" name="foo" value="a">
        <input type="radio" name="foo" value="b">
      </storage-form>`);
    const b = query<HTMLInputElement>("[value=b]");
    expect(query<HTMLInputElement>("[value=a]").checked).toBe(true);
    await check(b, true);
    expect(localStorage.getItem("foo")).toBe("b");
    expect(b.checked).toBe(true);
  });

  it("should keep the stored value on an event without changes", async () => {
    localStorage.setItem("foo", "x");
    await render(`
      <storage-form storage-area="local-storage"><input name="foo"></storage-form>`);
    query("input").dispatchEvent(new Event("change", { bubbles: true }));
    await flush();
    expect(dump(localStorage)).toEqual({ foo: "x" });
  });

  it("should not write unchanged values", async () => {
    localStorage.setItem("foo", "stored");
    await render(`
      <storage-form storage-area="local-storage"><input name="foo"></storage-form>`);
    const setItem = jest.spyOn(Storage.prototype, "setItem");
    await input(query("input"), "stored");
    expect(setItem).not.toHaveBeenCalled();
  });

  it("should stop writing after disconnected", async () => {
    await render(`
      <storage-form storage-area="local-storage"><input name="foo"></storage-form>`);
    const e = query<HTMLInputElement>("input");
    query("storage-form").remove();
    await input(e, "typed");
    expect(localStorage).toHaveLength(0);
  });

  it("should work after reconnected", async () => {
    await render(`
      <storage-form storage-area="local-storage"><input name="foo"></storage-form>`);
    const form = query("storage-form");
    form.remove();
    localStorage.setItem("foo", "stored");
    document.body.append(form);
    await flush();
    expect(query<HTMLInputElement>("input").value).toBe("stored");
    await input(query("input"), "typed");
    expect(localStorage.getItem("foo")).toBe("typed");
  });
});

describe("synchronization", () => {
  it("should synchronize elements with the same name", async () => {
    await render(`
      <storage-form storage-area="local-storage">
        <input name="foo">
        <output name="foo"></output>
        <input type="checkbox" name="foo" value="typed">
        <input name="bar" value="">
      </storage-form>`);
    await input(query("input"), "typed");
    expect(query<HTMLOutputElement>("output").value).toBe("typed");
    expect(query<HTMLInputElement>("[type=checkbox]").checked).toBe(true);
    expect(query<HTMLInputElement>("[name=bar]").value).toBe("");
  });

  it("should store the value of the edited control of the same name", async () => {
    await render(`
      <storage-form storage-area="local-storage">
        <input name="foo" id="a"><input name="foo" id="b">
      </storage-form>`);
    await input(query("#b"), "typed");
    expect(localStorage.getItem("foo")).toBe("typed");
    expect(query<HTMLInputElement>("#a").value).toBe("typed");
  });

  it("should synchronize between forms of the same area", async () => {
    await render(`
      <storage-form storage-area="local-storage"><input name="foo" id="a"></storage-form>
      <storage-form storage-area="local-storage"><input name="foo" id="b"></storage-form>
      <storage-form storage-area="session-storage"><input name="foo" id="c"></storage-form>`);
    await input(query("#a"), "typed");
    expect(query<HTMLInputElement>("#b").value).toBe("typed");
    expect(query<HTMLInputElement>("#c").value).toBe("");
  });

  it("should follow changes by another window", async () => {
    await render(`
      <storage-form storage-area="local-storage">
        <input name="foo" value="default">
        <input name="bar" value="default">
      </storage-form>`);
    const foo = query<HTMLInputElement>("[name=foo]");
    await updateFromAnotherWindow(localStorage, "foo", "updated");
    expect(foo.value).toBe("updated");
    await updateFromAnotherWindow(localStorage, "foo", null);
    expect(foo.value).toBe("default");
    expect(query<HTMLInputElement>("[name=bar]").value).toBe("default");
  });

  it("should not store the default value again after another window removes the value", async () => {
    localStorage.setItem("foo", "stored");
    await render(`
      <storage-form storage-area="local-storage">
        <input name="foo" value="default">
      </storage-form>`);
    await updateFromAnotherWindow(localStorage, "foo", null);
    expect(query<HTMLInputElement>("input").value).toBe("default");
    expect(localStorage.getItem("foo")).toBeNull();
  });

  it("should not store the default of a removed value by editing another name", async () => {
    localStorage.setItem("foo", "stored");
    await render(`
      <storage-form storage-area="local-storage">
        <input name="foo" value="default"><input name="bar">
      </storage-form>`);
    await updateFromAnotherWindow(localStorage, "foo", null);
    await input(query("[name=bar]"), "typed");
    expect(dump(localStorage)).toEqual({ bar: "typed" });
  });

  it("should reset values if the storage is cleared by another window", async () => {
    localStorage.setItem("foo", "stored");
    await render(`
      <storage-form storage-area="local-storage">
        <input type="checkbox" name="foo" value="stored">
      </storage-form>`);
    localStorage.clear();
    dispatchEvent(
      new StorageEvent("storage", { key: null, storageArea: localStorage }),
    );
    await flush();
    expect(query<HTMLInputElement>("input").checked).toBe(false);
  });
});

describe("storage-area", () => {
  it("should reflect storageArea property to the attribute", async () => {
    await render(`<storage-form></storage-form>`);
    const form = query<HTMLStorageFormElement>("storage-form");
    expect(form.storageArea).toBe("");
    form.storageArea = "local-storage";
    expect(form.getAttribute("storage-area")).toBe("local-storage");
  });

  it("should switch the storage", async () => {
    localStorage.setItem("foo", "local");
    sessionStorage.setItem("foo", "session");
    await render(`
      <storage-form storage-area="local-storage"><input name="foo"></storage-form>`);
    const e = query<HTMLInputElement>("input");
    query<HTMLStorageFormElement>("storage-form").storageArea =
      "session-storage";
    await flush();
    expect(e.value).toBe("session");
    await input(e, "typed");
    expect(localStorage.getItem("foo")).toBe("local");
    expect(sessionStorage.getItem("foo")).toBe("typed");
  });

  it("should read the storage once on the area change", async () => {
    await render(`
      <storage-form storage-area="session-storage"><input name="foo"></storage-form>`);
    const read = jest.spyOn(WebStorageHandler.prototype, "read");
    query("storage-form").setAttribute("storage-area", "local-storage");
    await flush();
    expect(read).toHaveBeenCalledTimes(1);
  });

  it("should load and store the controls after the area is set", async () => {
    localStorage.setItem("foo", "stored");
    await render(`<storage-form><input name="foo"></storage-form>`);
    const read = jest.spyOn(WebStorageHandler.prototype, "read");
    const e = query<HTMLInputElement>("input");
    query("storage-form").setAttribute("storage-area", "local-storage");
    await flush();
    expect(read).toHaveBeenCalledTimes(1);
    expect(e.value).toBe("stored");
    await input(e, "typed");
    expect(dump(localStorage)).toEqual({ foo: "typed" });
  });

  it("should not read the controls on the area change before connected", async () => {
    localStorage.setItem("foo", "stored");
    const form = document.createElement("storage-form");
    form.innerHTML = `<input name="foo">`;
    const read = jest.spyOn(WebStorageHandler.prototype, "read");
    form.setAttribute("storage-area", "local-storage");
    await flush();
    expect(read).not.toHaveBeenCalledWith(["foo"]);
    document.body.append(form);
    await flush();
    expect(query<HTMLInputElement>("input").value).toBe("stored");
  });

  it("should release the controls after the area is removed", async () => {
    await render(`
      <storage-form storage-area="local-storage"><input name="foo"></storage-form>`);
    query("storage-form").removeAttribute("storage-area");
    await flush();
    await input(query("input"), "typed");
    expect(localStorage).toHaveLength(0);
  });

  describe("edits before the area is set", () => {
    it("should store the edited value if nothing is stored", async () => {
      await render(`
        <storage-form><input name="foo" value="default"></storage-form>`);
      await input(query("input"), "typed");
      query("storage-form").setAttribute("storage-area", "local-storage");
      await flush();
      expect(query<HTMLInputElement>("input").value).toBe("typed");
      expect(dump(localStorage)).toEqual({ foo: "typed" });
    });

    it("should respect the stored value", async () => {
      localStorage.setItem("foo", "stored");
      await render(`
        <storage-form><input name="foo" value="default"></storage-form>`);
      await input(query("input"), "typed");
      query("storage-form").setAttribute("storage-area", "local-storage");
      await flush();
      expect(query<HTMLInputElement>("input").value).toBe("stored");
      expect(dump(localStorage)).toEqual({ foo: "stored" });
    });

    it("should store the last edited value of the same name", async () => {
      await render(`
        <storage-form>
          <input name="foo" id="a"><input name="foo" id="b">
        </storage-form>`);
      await input(query("#b"), "b");
      await input(query("#a"), "a");
      query("storage-form").setAttribute("storage-area", "local-storage");
      await flush();
      expect(dump(localStorage)).toEqual({ foo: "a" });
      expect(query<HTMLInputElement>("#b").value).toBe("a");
    });

    it("should keep the edits for the outer form which gets the area", async () => {
      await render(`
        <storage-form id="outer">
          <storage-form id="inner"><input name="foo"></storage-form>
        </storage-form>`);
      await input(query("input"), "typed");
      query("#outer").setAttribute("storage-area", "local-storage");
      await flush();
      expect(dump(localStorage)).toEqual({ foo: "typed" });
    });

    it("should keep the edits made after the area is removed", async () => {
      await render(`
        <storage-form storage-area="local-storage"><input name="foo"></storage-form>`);
      const form = query("storage-form");
      form.removeAttribute("storage-area");
      await flush();
      await input(query("input"), "typed");
      form.setAttribute("storage-area", "session-storage");
      await flush();
      expect(localStorage).toHaveLength(0);
      expect(dump(sessionStorage)).toEqual({ foo: "typed" });
    });

    it("should keep an unchecked checkbox", async () => {
      await render(`
        <storage-form><input name="foo" type="checkbox" checked></storage-form>`);
      await check(query("input"), false);
      query("storage-form").setAttribute("storage-area", "local-storage");
      await flush();
      expect(query<HTMLInputElement>("input").checked).toBe(false);
      expect(localStorage).toHaveLength(0);
    });

    it("should keep the edits of a new name moved into a loaded form", async () => {
      await render(`
        <storage-form id="loaded" storage-area="local-storage"></storage-form>
        <storage-form><input name="foo" id="moved" value="default"></storage-form>`);
      const moved = query<HTMLInputElement>("#moved");
      await input(moved, "typed");
      query("#loaded").append(moved);
      await flush();
      expect(moved.value).toBe("typed");
      expect(dump(localStorage)).toEqual({ foo: "typed" });
    });

    it("should discard the edits of a control moved into a loaded form", async () => {
      await render(`
        <storage-form id="loaded" storage-area="local-storage"><input name="foo"></storage-form>
        <storage-form><input name="foo" id="moved" value="default"></storage-form>`);
      const moved = query<HTMLInputElement>("#moved");
      await input(moved, "typed");
      query("#loaded").append(moved);
      await flush();
      expect(moved.value).toBe("default");
      expect(localStorage).toHaveLength(0);
    });

    it("should not keep edits stored by another form", async () => {
      await render(`
        <storage-form id="outer" storage-area="local-storage">
          <storage-form id="inner"><input name="foo"></storage-form>
        </storage-form>`);
      await input(query("input"), "typed");
      expect(dump(localStorage)).toEqual({ foo: "typed" });
      query("#inner").setAttribute("storage-area", "session-storage");
      await flush();
      expect(sessionStorage).toHaveLength(0);
    });
  });
});

describe("edits before the initial loading", () => {
  const reads: ReturnType<typeof withResolves<void>>[] = [];
  const asyncHandler = (storage: Storage): AreaHandler => {
    const handler = new WebStorageHandler(storage);
    return Object.assign(Object.create(handler) as WebStorageHandler, {
      read: async (names: string[]) => {
        if (isReadFailing) throw Error("read failed");
        // The value is decided when the read starts, as slow storages do.
        const result = handler.read(names);
        const read = withResolves();
        reads.push(read);
        await read.promise;
        return result;
      },
    });
  };
  let isReadFailing = false;
  registerHandler("async-local", asyncHandler(localStorage));
  registerHandler("async-session", asyncHandler(sessionStorage));

  /** Completes all reads including ones started by the completion. */
  async function completeReads() {
    while (reads.length > 0) {
      for (const r of reads.splice(0)) r.resolve();
      await flush();
    }
  }

  afterEach(async () => {
    isReadFailing = false;
    await completeReads();
  });

  it("should store the edited value if nothing is stored", async () => {
    await render(`
      <storage-form storage-area="async-local">
        <input name="foo" value="default"><input name="bar" type="checkbox">
      </storage-form>`);
    const foo = query<HTMLInputElement>("[name=foo]");
    await input(foo, "typed");
    await check(query("[name=bar]"), true);
    expect(localStorage).toHaveLength(0);

    const listener = jest.fn();
    document.body.addEventListener("change", listener);
    await completeReads();
    document.body.removeEventListener("change", listener);
    expect(foo.value).toBe("typed");
    expect(query<HTMLInputElement>("[name=bar]").checked).toBe(true);
    expect(dump(localStorage)).toEqual({ foo: "typed", bar: "on" });
    expect(listener).not.toHaveBeenCalled();
  });

  it("should store an emptied value", async () => {
    await render(`
      <storage-form storage-area="async-local">
        <input name="foo" value="default">
      </storage-form>`);
    await input(query("input"), "");
    await completeReads();
    expect(query<HTMLInputElement>("input").value).toBe("");
    expect(dump(localStorage)).toEqual({ foo: "" });
  });

  it("should keep an unchecked checkbox", async () => {
    await render(`
      <storage-form storage-area="async-local">
        <input name="foo" type="checkbox" checked>
      </storage-form>`);
    await check(query("input"), false);
    await completeReads();
    expect(query<HTMLInputElement>("input").checked).toBe(false);
    expect(localStorage).toHaveLength(0);
  });

  it("should keep the edited value while its writing is delayed", async () => {
    const write = jest
      .spyOn(WebStorageHandler.prototype, "write")
      .mockReturnValue(new Promise(() => undefined) as never);
    await render(`
      <storage-form storage-area="async-local"><input name="foo"></storage-form>`);
    await input(query("input"), "typed");
    await completeReads();
    expect(query<HTMLInputElement>("input").value).toBe("typed");
    expect(write.mock.calls).toEqual([[new Map([["foo", "typed"]])]]);
    await updateFromAnotherWindow(localStorage, "foo", "updated");
    expect(query<HTMLInputElement>("input").value).toBe("updated");
  });

  it("should respect the stored value", async () => {
    localStorage.setItem("foo", "stored");
    await render(`
      <storage-form storage-area="async-local"><input name="foo"></storage-form>`);
    await input(query("input"), "typed");
    await completeReads();
    expect(query<HTMLInputElement>("input").value).toBe("stored");
    expect(dump(localStorage)).toEqual({ foo: "stored" });
  });

  it("should reset controls changed without events", async () => {
    await render(`
      <storage-form storage-area="async-local">
        <input name="foo" value="default"><input name="bar">
      </storage-form>`);
    const foo = query<HTMLInputElement>("[name=foo]");
    foo.value = "changed";
    await input(query("[name=bar]"), "typed");
    await completeReads();
    expect(foo.value).toBe("default");
    expect(localStorage.getItem("bar")).toBe("typed");
  });

  it("should prefer the last edited control of the same name", async () => {
    await render(`
      <storage-form storage-area="async-local">
        <input name="foo" id="a" value="default">
        <input name="foo" id="b">
        <input name="foo" id="c">
      </storage-form>`);
    await input(query("#c"), "first");
    await input(query("#b"), "last");
    await completeReads();
    for (const id of ["#a", "#b", "#c"])
      expect(query<HTMLInputElement>(id).value).toBe("last");
    expect(dump(localStorage)).toEqual({ foo: "last" });
  });

  it("should prefer the last edit to an older edit in a form without the area", async () => {
    await render(`
      <storage-form id="none"><input name="foo" id="old"></storage-form>
      <storage-form id="loading" storage-area="async-local">
        <input name="foo" id="new">
      </storage-form>`);
    await input(query("#old"), "old");
    await input(query("#new"), "new");
    query("#loading").append(query("#old"));
    await completeReads();
    expect(query<HTMLInputElement>("#old").value).toBe("new");
    expect(dump(localStorage)).toEqual({ foo: "new" });
  });

  it("should prefer the last edit in a form without the area to an older edit", async () => {
    await render(`
      <storage-form id="loading" storage-area="async-local">
        <input name="foo" id="owned">
      </storage-form>
      <storage-form><input name="foo" id="moved"></storage-form>`);
    await input(query("#owned"), "owned");
    await input(query("#moved"), "moved");
    query("#loading").append(query("#moved"));
    await completeReads();
    expect(query<HTMLInputElement>("#owned").value).toBe("moved");
    expect(dump(localStorage)).toEqual({ foo: "moved" });
  });

  it("should keep the edits while the area is removed and set again", async () => {
    await render(`
      <storage-form storage-area="async-local"><input name="foo"></storage-form>`);
    await input(query("input"), "typed");
    const form = query("storage-form");
    form.removeAttribute("storage-area");
    await flush();
    form.setAttribute("storage-area", "async-session");
    await completeReads();
    expect(query<HTMLInputElement>("input").value).toBe("typed");
    expect(localStorage).toHaveLength(0);
    expect(dump(sessionStorage)).toEqual({ foo: "typed" });
  });

  it("should store only the edited value if another control is loaded", async () => {
    localStorage.setItem("bar", "stored");
    const write = jest.spyOn(WebStorageHandler.prototype, "write");
    await render(`
      <storage-form storage-area="async-local">
        <input name="foo" id="a" value="default"><input name="foo" id="b">
        <input name="bar">
      </storage-form>`);
    await input(query("#b"), "typed");
    await completeReads();
    for (const [items] of write.mock.calls)
      expect(items).toEqual(new Map([["foo", "typed"]]));
    expect(dump(localStorage)).toEqual({ foo: "typed", bar: "stored" });
  });

  it("should not write the edited value twice nor sanitized values", async () => {
    const write = jest.spyOn(WebStorageHandler.prototype, "write");
    await render(`
      <storage-form storage-area="async-local">
        <input name="foo" type="number" value="1"><input name="foo" id="b">
      </storage-form>`);
    await input(query("#b"), "typed");
    await completeReads();
    expect(write.mock.calls).toEqual([[new Map([["foo", "typed"]])]]);
    expect(query<HTMLInputElement>("#b").value).toBe("typed");
  });

  it("should store edits made before the write is notified", async () => {
    const write = jest.spyOn(WebStorageHandler.prototype, "write");
    await render(`
      <storage-form storage-area="async-local">
        <input name="foo"><input name="bar" type="checkbox">
      </storage-form>`);
    // Queued loadings delay the notification.
    query("storage-form").append("text");
    await flush();
    await input(query("[name=foo]"), "typed");
    while (write.mock.calls.length === 0) {
      reads.shift()?.resolve();
      await flush();
    }
    await check(query("[name=bar]"), true);
    expect(write.mock.lastCall).toEqual([new Map([["bar", "on"]])]);
    await input(query("[name=foo]"), "retyped");
    expect(write.mock.lastCall?.[0].get("foo")).toBe("retyped");
    await completeReads();
    expect(query<HTMLInputElement>("[name=foo]").value).toBe("retyped");
    expect(dump(localStorage)).toEqual({ foo: "retyped", bar: "on" });
  });

  it("should store the edited value again after its write failed", async () => {
    const error = jest.spyOn(console, "error").mockReturnValue();
    const write = jest
      .spyOn(WebStorageHandler.prototype, "write")
      .mockImplementationOnce(() => {
        // Storage#setItem throws synchronously if the quota is exceeded.
        throw Error("quota exceeded");
      });
    await render(`
      <storage-form storage-area="async-local"><input name="foo"></storage-form>`);
    await input(query("input"), "typed");
    await completeReads();
    expect(error).toHaveBeenCalledTimes(1);
    expect(localStorage).toHaveLength(0);
    await input(query("input"), "typed");
    expect(write).toHaveBeenCalledTimes(2);
    expect(dump(localStorage)).toEqual({ foo: "typed" });
  });

  it("should store the same value again after it is deleted", async () => {
    await render(`
      <storage-form storage-area="async-local"><input name="foo"></storage-form>`);
    await input(query("input"), "typed");
    await completeReads();
    await updateFromAnotherWindow(localStorage, "foo", null);
    localStorage.clear();
    await input(query("input"), "typed");
    expect(dump(localStorage)).toEqual({ foo: "typed" });
  });

  it("should not load again by edits while loading", async () => {
    const read = jest.spyOn(WebStorageHandler.prototype, "read");
    const html = `
      <storage-form storage-area="async-local"><input name="foo"></storage-form>`;
    await render(html);
    await completeReads();
    const count = read.mock.calls.length;
    read.mockClear();
    await render(html);
    await input(query("input"), "a");
    await input(query("input"), "ab");
    await completeReads();
    expect(read).toHaveBeenCalledTimes(count);
  });

  it("should write the edited value into a control added before the write is notified", async () => {
    await render(`
      <storage-form storage-area="async-local">
        <input name="foo"><input name="foo" id="b" value="default">
      </storage-form>`);
    const form = query("storage-form");
    const added = document.createElement("input");
    added.name = "foo";
    // Queued loadings delay the notification.
    form.append("text");
    await flush();
    await input(query("input"), "typed");
    query("#b").addEventListener("change", () => {
      form.append(added);
    });
    while (!added.isConnected) {
      reads.shift()?.resolve();
      await flush();
    }
    expect(added.value).toBe("typed");
    await completeReads();
    expect(dump(localStorage)).toEqual({ foo: "typed" });
  });

  it.each([
    ["initial", "async-local", localStorage],
    ["new", "async-session", sessionStorage],
  ])(
    "should recover from a failure to read the %s area",
    async (_, area, storage) => {
      const error = jest.spyOn(console, "error").mockReturnValue();
      const isInitial = storage === localStorage;
      isReadFailing = isInitial;
      await render(`
      <storage-form storage-area="async-local">
        <input name="foo"><input name="bar"><input name="baz">
      </storage-form>`);
      await completeReads();
      isReadFailing = true;
      query<HTMLStorageFormElement>("storage-form").storageArea = area;
      await flush();
      const foo = query<HTMLInputElement>("[name=foo]");
      const bar = query<HTMLInputElement>("[name=bar]");
      const baz = query<HTMLInputElement>("[name=baz]");

      await updateFromAnotherWindow(storage, "foo", "new");
      expect(foo.value).toBe("new");

      error.mockClear();
      await input(bar, "failed");
      expect(error).toHaveBeenCalledTimes(1);
      expect(storage.getItem("bar")).toBeNull();

      isReadFailing = false;
      storage.setItem("baz", "stored");
      await input(foo, "typed");
      expect(storage.getItem("foo")).toBe("typed");
      await input(bar, "typed");
      await input(baz, "typed");
      expect(reads).toHaveLength(1);
      await completeReads();
      expect(dump(storage)).toEqual({
        foo: "typed",
        bar: "typed",
        baz: "stored",
      });
      expect(baz.value).toBe("stored");
    },
  );

  it.each(["foo", "area"])(
    "should not mix areas if a listener changes the area, with %s first",
    async (first) => {
      localStorage.setItem("area", "async-session");
      sessionStorage.setItem("foo", "precious");
      const foo = `<input name="foo">`;
      const select = `
        <select name="area"><option>async-local<option>async-session</select>`;
      await render(`
        <storage-form storage-area="async-local">
          ${first === "foo" ? foo + select : select + foo}
        </storage-form>`);
      const form = query<HTMLStorageFormElement>("storage-form");
      query("select").addEventListener(
        "change",
        () => {
          form.storageArea = "async-session";
        },
        { once: true },
      );
      await input(query("input"), "typed");
      await completeReads();
      expect(query<HTMLInputElement>("input").value).toBe("precious");
      expect(sessionStorage.getItem("foo")).toBe("precious");
      expect(localStorage.getItem("foo")).toBe("typed");
      // The change event by loading is not an edit in the new area.
      expect(query<HTMLSelectElement>("select").value).toBe("async-local");
      expect(sessionStorage.getItem("area")).not.toBe("async-session");
    },
  );

  it("should not write the old value into a control added while disconnected", async () => {
    localStorage.setItem("foo", "old");
    await render(`
      <storage-form storage-area="async-local"><input name="foo"></storage-form>`);
    await completeReads();
    const form = query("storage-form");
    form.remove();
    const added = document.createElement("input");
    added.name = "foo";
    form.append(added);
    document.body.append(form);
    expect(added.value).toBe("");
    await completeReads();
    expect(added.value).toBe("old");
  });

  it("should store the checked radio instead of the default one", async () => {
    await render(`
      <storage-form storage-area="async-local">
        <input type="radio" name="foo" value="a" checked>
        <input type="radio" name="foo" value="b">
        <input type="radio" name="foo" value="c">
      </storage-form>`);
    await check(query("[value=c]"), true);
    await check(query("[value=b]"), true);
    await completeReads();
    expect(query<HTMLInputElement>(":checked").value).toBe("b");
    expect(dump(localStorage)).toEqual({ foo: "b" });
  });

  it("should respect the stored radio", async () => {
    localStorage.setItem("foo", "a");
    await render(`
      <storage-form storage-area="async-local">
        <input type="radio" name="foo" value="a">
        <input type="radio" name="foo" value="b">
      </storage-form>`);
    await check(query("[value=b]"), true);
    await completeReads();
    expect(query<HTMLInputElement>(":checked").value).toBe("a");
    expect(dump(localStorage)).toEqual({ foo: "a" });
  });

  it("should keep the edit even if another control is loaded", async () => {
    localStorage.setItem("foo", "stored");
    await render(`
      <storage-form storage-area="async-local">
        <input name="foo"><input name="bar">
      </storage-form>`);
    await input(query("[name=bar]"), "typed");
    await completeReads();
    expect(query<HTMLInputElement>("[name=bar]").value).toBe("typed");
    expect(dump(localStorage)).toEqual({ foo: "stored", bar: "typed" });
  });

  it("should store the edit of a control added later", async () => {
    await render(`<storage-form storage-area="async-local"></storage-form>`);
    await completeReads();
    const div = document.createElement("div");
    div.innerHTML = `<input name="foo">`;
    query("storage-form").append(div);
    await flush();
    await input(query("input"), "typed");
    expect(localStorage).toHaveLength(0);
    await completeReads();
    expect(query<HTMLInputElement>("input").value).toBe("typed");
    expect(dump(localStorage)).toEqual({ foo: "typed" });
  });

  it("should forget the edit of a removed control", async () => {
    await render(`
      <storage-form storage-area="async-local">
        <input name="foo" id="a" value="default"><input name="foo" id="b">
      </storage-form>`);
    const b = query<HTMLInputElement>("#b");
    await input(b, "typed");
    b.remove();
    await completeReads();
    expect(query<HTMLInputElement>("#a").value).toBe("default");
    expect(localStorage).toHaveLength(0);
  });

  it("should respect the stored value after reconnected", async () => {
    await render(`
      <storage-form storage-area="async-local"><input name="foo"></storage-form>`);
    await completeReads();
    const form = query("storage-form");
    form.remove();
    localStorage.setItem("foo", "stored");
    document.body.append(form);
    await input(query("input"), "typed");
    await completeReads();
    expect(query<HTMLInputElement>("input").value).toBe("stored");
    expect(dump(localStorage)).toEqual({ foo: "stored" });
  });

  it("should not carry a stored edit over to the new area", async () => {
    await render(`
      <storage-form storage-area="async-local">
        <input name="foo" type="checkbox">
      </storage-form>`);
    await completeReads();
    await check(query("input"), true);
    query<HTMLStorageFormElement>("storage-form").storageArea = "async-session";
    await completeReads();
    expect(query<HTMLInputElement>("input").checked).toBe(false);
    expect(dump(localStorage)).toEqual({ foo: "on" });
    expect(sessionStorage).toHaveLength(0);
  });

  it("should keep the edit when the form is moved", async () => {
    await render(`
      <storage-form storage-area="async-local"><input name="foo"></storage-form>`);
    await input(query("input"), "typed");
    document.body.append(query("storage-form"));
    await completeReads();
    expect(query<HTMLInputElement>("input").value).toBe("typed");
    expect(dump(localStorage)).toEqual({ foo: "typed" });
  });

  it.each([
    ["nothing", undefined, "typed"],
    ["a value", "stored", "stored"],
  ])(
    "should handle the edit if the area is changed to one storing %s",
    async (_, stored, expected) => {
      if (stored) sessionStorage.setItem("foo", stored);
      await render(`
        <storage-form storage-area="async-local"><input name="foo"></storage-form>`);
      await input(query("input"), "typed");
      query<HTMLStorageFormElement>("storage-form").storageArea =
        "async-session";
      await completeReads();
      expect(query<HTMLInputElement>("input").value).toBe(expected);
      expect(localStorage).toHaveLength(0);
      expect(dump(sessionStorage)).toEqual({ foo: expected });
    },
  );

  it.each([
    ["nothing", undefined, "typed"],
    ["a value", "stored", "stored"],
  ])(
    "should handle an edit while loading the new area storing %s",
    async (_, stored, expected) => {
      localStorage.setItem("foo", "local");
      if (stored) sessionStorage.setItem("foo", stored);
      await render(`
        <storage-form storage-area="async-local"><input name="foo"></storage-form>`);
      await completeReads();
      query<HTMLStorageFormElement>("storage-form").storageArea =
        "async-session";
      await input(query("input"), "typed");
      await completeReads();
      expect(query<HTMLInputElement>("input").value).toBe(expected);
      expect(dump(localStorage)).toEqual({ foo: "local" });
      expect(dump(sessionStorage)).toEqual({ foo: expected });
    },
  );

  it("should ignore an update of the old area", async () => {
    sessionStorage.setItem("foo", "stored");
    await render(`
      <storage-form storage-area="async-local"><input name="foo"></storage-form>`);
    await completeReads();
    const form = query<HTMLStorageFormElement>("storage-form");
    // Mutations start a reload.
    form.append("text");
    await flush();
    await updateFromAnotherWindow(localStorage, "foo", "updated");
    form.storageArea = "async-session";
    for (const r of reads.splice(0)) r.resolve();
    await flush();
    await input(query("input"), "typed");
    await completeReads();
    expect(query<HTMLInputElement>("input").value).toBe("stored");
    expect(dump(sessionStorage)).toEqual({ foo: "stored" });
  });
});

describe("DOM mutations", () => {
  it("should handle an added control", async () => {
    localStorage.setItem("foo", "stored");
    await render(`<storage-form storage-area="local-storage"></storage-form>`);
    const e = document.createElement("input");
    e.name = "foo";
    query("storage-form").append(e);
    await flush();
    expect(e.value).toBe("stored");
    await input(e, "typed");
    expect(localStorage.getItem("foo")).toBe("typed");
  });

  it("should handle an added control with the same name", async () => {
    localStorage.setItem("foo", "stored");
    await render(`
      <storage-form storage-area="local-storage"><input name="foo"></storage-form>`);
    const e = document.createElement("input");
    e.name = "foo";
    query("storage-form").append(e);
    await flush();
    expect(e.value).toBe("stored");
  });

  it("should handle controls in an added subtree", async () => {
    localStorage.setItem("foo", "stored");
    await render(`<storage-form storage-area="local-storage"></storage-form>`);
    const div = document.createElement("div");
    div.innerHTML = `<input name="foo">`;
    query("storage-form").append(div);
    await flush();
    expect(query<HTMLInputElement>("input").value).toBe("stored");
  });

  it("should ignore storage custom elements in an added subtree", async () => {
    await render(`<storage-form storage-area="local-storage"></storage-form>`);
    const div = document.createElement("div");
    div.innerHTML = `<input name="foo" is="storage-input"><input name="foo" id="b">`;
    query("storage-form").append(div);
    await flush();
    await input(query("#b"), "typed");
    expect(query<HTMLInputElement>("[is=storage-input]").value).toBe("");
    expect(dump(localStorage)).toEqual({ foo: "typed" });
  });

  it("should not touch controls in a removed subtree", async () => {
    await render(`
      <storage-form storage-area="local-storage">
        <input name="foo" id="a"><div><input name="foo" id="b"></div>
      </storage-form>`);
    const b = query<HTMLInputElement>("#b");
    query("div").remove();
    await flush();
    await input(query("#a"), "typed");
    expect(b.value).toBe("");
  });

  it("should leave controls in a nested form to the nested form", async () => {
    localStorage.setItem("foo", "local");
    sessionStorage.setItem("foo", "session");
    await render(`
      <storage-form storage-area="local-storage">
        <input name="foo" id="a">
        <storage-form storage-area="session-storage">
          <div><input name="foo" id="b"></div>
        </storage-form>
      </storage-form>`);
    const b = query<HTMLInputElement>("#b");
    expect(query<HTMLInputElement>("#a").value).toBe("local");
    expect(b.value).toBe("session");
    await input(b, "typed");
    expect(dump(localStorage)).toEqual({ foo: "local" });
    expect(dump(sessionStorage)).toEqual({ foo: "typed" });
  });

  it("should manage controls in a nested form without storage-area", async () => {
    localStorage.setItem("foo", "stored");
    await render(`
      <storage-form storage-area="local-storage">
        <storage-form><div><input name="foo"></div></storage-form>
      </storage-form>`);
    const e = query<HTMLInputElement>("input");
    expect(e.value).toBe("stored");
    await input(e, "typed");
    expect(localStorage.getItem("foo")).toBe("typed");
  });

  it("should follow storage-area of a nested form", async () => {
    localStorage.setItem("foo", "local");
    sessionStorage.setItem("foo", "session");
    await render(`
      <storage-form storage-area="local-storage">
        <storage-form id="inner"><div><input name="foo"></div></storage-form>
      </storage-form>`);
    const inner = query("#inner");
    const e = query<HTMLInputElement>("input");
    inner.setAttribute("storage-area", "session-storage");
    await flush();
    expect(e.value).toBe("session");
    await input(e, "typed");
    expect(dump(localStorage)).toEqual({ foo: "local" });
    expect(dump(sessionStorage)).toEqual({ foo: "typed" });

    inner.removeAttribute("storage-area");
    await flush();
    expect(e.value).toBe("local");
    await input(e, "retyped");
    expect(dump(localStorage)).toEqual({ foo: "retyped" });
    expect(dump(sessionStorage)).toEqual({ foo: "typed" });
  });

  it("should not handle edits in a nested form by the outer form", async () => {
    await render(`
      <storage-form storage-area="local-storage">
        <input name="foo">
        <storage-form storage-area="session-storage">
          <input name="foo" id="inner">
        </storage-form>
      </storage-form>`);
    await input(query("#inner"), "typed");
    expect(localStorage.getItem("foo")).toBeNull();
    expect(dump(sessionStorage)).toEqual({ foo: "typed" });
  });

  it("should release controls in a removed nested form", async () => {
    await render(`
      <storage-form storage-area="local-storage" id="outer">
        <input name="foo" id="a">
        <storage-form storage-area="local-storage" id="inner">
          <div><input name="foo" id="b"></div>
        </storage-form>
      </storage-form>`);
    const b = query<HTMLInputElement>("#b");
    await input(b, "before");
    expect(query<HTMLInputElement>("#a").value).toBe("before");
    query("#inner").remove();
    await flush();
    await input(query("#a"), "after");
    expect(b.value).toBe("before");
  });

  it("should handle controls in an added nested form", async () => {
    localStorage.setItem("foo", "stored");
    await render(`<storage-form storage-area="local-storage"></storage-form>`);
    const inner = document.createElement("storage-form");
    inner.setAttribute("storage-area", "local-storage");
    inner.innerHTML = `<div><input name="foo"></div>`;
    query("storage-form").append(inner);
    await flush();
    const e = query<HTMLInputElement>("input");
    expect(e.value).toBe("stored");
    await input(e, "typed");
    expect(localStorage.getItem("foo")).toBe("typed");
  });

  it("should keep handling a control moved within the form", async () => {
    await render(`
      <storage-form storage-area="local-storage">
        <div><input name="foo"></div><p></p>
      </storage-form>`);
    const e = query<HTMLInputElement>("input");
    await input(e, "typed");
    query("p").append(query("div"));
    await flush();
    expect(e.value).toBe("typed");
    await input(e, "retyped");
    expect(localStorage.getItem("foo")).toBe("retyped");
    await updateFromAnotherWindow(localStorage, "foo", "updated");
    expect(e.value).toBe("updated");
  });

  it("should release a control renamed and removed at once", async () => {
    await render(`
      <storage-form storage-area="local-storage">
        <input name="foo" id="a"><div><input name="foo" id="b"></div>
      </storage-form>`);
    const b = query<HTMLInputElement>("#b");
    b.name = "bar";
    query("div").remove();
    await flush();
    await input(query("#a"), "typed");
    await updateFromAnotherWindow(localStorage, "bar", "updated");
    expect(b.value).toBe("");
  });

  it("should not touch a removed control", async () => {
    await render(`
      <storage-form storage-area="local-storage">
        <input name="foo" id="a"><input name="foo" id="b">
      </storage-form>`);
    const b = query<HTMLInputElement>("#b");
    b.remove();
    await flush();
    await input(query("#a"), "typed");
    expect(b.value).toBe("");
  });

  it("should follow the name change", async () => {
    localStorage.setItem("foo", "foo value");
    localStorage.setItem("bar", "bar value");
    await render(`
      <storage-form storage-area="local-storage"><input name="foo"></storage-form>`);
    const e = query<HTMLInputElement>("input");
    e.name = "bar";
    await flush();
    expect(e.value).toBe("bar value");
    await input(e, "typed");
    expect(dump(localStorage)).toEqual({ foo: "foo value", bar: "typed" });
  });

  it("should store an input in the same task as the name change under the new name", async () => {
    localStorage.setItem("foo", "old");
    await render(`
      <storage-form storage-area="local-storage">
        <input name="foo" id="a"><input name="foo" id="b">
      </storage-form>`);
    const b = query<HTMLInputElement>("#b");
    b.name = "bar";
    await input(b, "typed");
    expect(dump(localStorage)).toEqual({ foo: "old", bar: "typed" });
    expect(query<HTMLInputElement>("#a").value).toBe("old");
  });

  it("should store an input in the same task as the change to a loaded name", async () => {
    localStorage.setItem("foo", "old");
    await render(`
      <storage-form storage-area="local-storage">
        <input name="foo" id="a"><input name="bar" id="b">
      </storage-form>`);
    const b = query<HTMLInputElement>("#b");
    b.name = "foo";
    await input(b, "typed");
    expect(dump(localStorage)).toEqual({ foo: "typed" });
    expect(query<HTMLInputElement>("#a").value).toBe("typed");
  });

  it("should keep a renamed edit when another element dispatches an input first", async () => {
    localStorage.setItem("foo", "old");
    await render(`
      <storage-form storage-area="local-storage">
        <input name="foo" id="a"><input name="bar" id="b"><input id="c">
      </storage-form>`);
    const b = query<HTMLInputElement>("#b");
    b.name = "foo";
    b.value = "typed";
    query("#c").dispatchEvent(new Event("input", { bubbles: true }));
    b.dispatchEvent(new Event("input", { bubbles: true }));
    await flush();
    expect(dump(localStorage)).toEqual({ foo: "typed" });
  });

  it("should handle a control after its name is set", async () => {
    localStorage.setItem("foo", "stored");
    await render(`
      <storage-form storage-area="local-storage"><input></storage-form>`);
    const e = query<HTMLInputElement>("input");
    e.name = "foo";
    await flush();
    expect(e.value).toBe("stored");
  });

  it("should release a control renamed and unnamed at once", async () => {
    await render(`
      <storage-form storage-area="local-storage">
        <input name="foo" id="a"><input name="foo" id="b">
      </storage-form>`);
    const b = query<HTMLInputElement>("#b");
    b.name = "bar";
    b.removeAttribute("name");
    await flush();
    await input(query("#a"), "typed");
    await updateFromAnotherWindow(localStorage, "bar", "updated");
    expect(b.value).toBe("");
  });

  it("should handle a control after its name is restored", async () => {
    localStorage.setItem("foo", "stored");
    await render(`
      <storage-form storage-area="local-storage"><input name="foo"></storage-form>`);
    const e = query<HTMLInputElement>("input");
    e.removeAttribute("name");
    await flush();
    await input(e, "typed");
    expect(localStorage.getItem("foo")).toBe("stored");
    e.name = "foo";
    await flush();
    expect(e.value).toBe("stored");
    await input(e, "retyped");
    expect(localStorage.getItem("foo")).toBe("retyped");
  });

  it("should release a control after its name is removed", async () => {
    await render(`
      <storage-form storage-area="local-storage">
        <input name="foo" id="a"><input name="foo" id="b">
      </storage-form>`);
    const b = query<HTMLInputElement>("#b");
    b.removeAttribute("name");
    await flush();
    await input(query("#a"), "typed");
    expect(b.value).toBe("");
  });
});

describe("failed and delayed writes", () => {
  let isWriteRejected = false;
  const rejectingHandler = (storage: Storage): AreaHandler => {
    const handler = new WebStorageHandler(storage);
    return Object.assign(Object.create(handler) as WebStorageHandler, {
      write: async (items: Map<string, string | undefined>) => {
        await Promise.resolve();
        if (isWriteRejected) throw Error("write rejected");
        handler.write(items);
      },
    });
  };
  registerHandler("rejecting-local", rejectingHandler(localStorage));
  registerHandler(
    "buffered-local",
    new BufferedWriteHandler(new WebStorageHandler(localStorage), 0),
  );

  afterEach(() => {
    isWriteRejected = false;
  });

  it("should show the stored value and store it again after a rejected write", async () => {
    const error = jest.spyOn(console, "error").mockImplementation();
    localStorage.setItem("foo", "stored");
    await render(`
      <storage-form storage-area="rejecting-local"><input name="foo"></storage-form>`);
    isWriteRejected = true;
    await input(query("input"), "typed");
    await flush();
    expect(query<HTMLInputElement>("input").value).toBe("stored");
    expect(dump(localStorage)).toEqual({ foo: "stored" });
    expect(error).toHaveBeenCalledWith(Error("write rejected"));

    isWriteRejected = false;
    await input(query("input"), "typed");
    expect(dump(localStorage)).toEqual({ foo: "typed" });
  });

  it("should not store the default value after a rejected write of a value not stored", async () => {
    jest.spyOn(console, "error").mockImplementation();
    await render(`
      <storage-form storage-area="rejecting-local">
        <input name="foo" value="default">
      </storage-form>`);
    isWriteRejected = true;
    await input(query("input"), "typed");
    await flush();
    isWriteRejected = false;
    await flush();
    expect(query<HTMLInputElement>("input").value).toBe("default");
    expect(localStorage).toHaveLength(0);
  });

  it("should keep the edited value when the form reloads during a delayed write", async () => {
    await render(`
      <storage-form storage-area="buffered-local"><input name="foo"></storage-form>`);
    // The first write is not delayed, and the next one waits for the interval.
    await input(query("input"), "first");
    await input(query("input"), "typed");
    expect(localStorage.getItem("foo")).toBe("first");
    query("storage-form").append(document.createElement("span"));
    await flush();
    await flush();
    expect(query<HTMLInputElement>("input").value).toBe("typed");
    // The interval includes the margin of BufferedWriteHandler.
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(localStorage.getItem("foo")).toBe("typed");
  });
});
