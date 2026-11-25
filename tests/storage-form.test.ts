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
