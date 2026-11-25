import {
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
});

describe("edits before the initial loading", () => {
  const reads: ReturnType<typeof withResolves<void>>[] = [];
  const asyncHandler = (storage: Storage): AreaHandler => {
    const handler = new WebStorageHandler(storage);
    return Object.assign(Object.create(handler) as WebStorageHandler, {
      read: async (names: string[]) => {
        // The value is decided when the read starts, as slow storages do.
        const result = handler.read(names);
        const read = withResolves();
        reads.push(read);
        await read.promise;
        return result;
      },
    });
  };
  registerHandler("async-local", asyncHandler(localStorage));
  registerHandler("async-session", asyncHandler(sessionStorage));

  /** Completes all reads including ones started by the completion. */
  async function completeReads() {
    while (reads.length > 0) {
      for (const r of reads.splice(0)) r.resolve();
      await flush();
    }
  }

  afterEach(completeReads);

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
