import {
  HTMLStorageInputElement,
  HTMLStorageOutputElement,
  HTMLStorageSelectElement,
  HTMLStorageTextAreaElement,
} from "../ts/storage-mono-controls.js";
import {
  check,
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

beforeEach(() => {
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

  // https://github.com/kui/storage-form/issues/40
  it.failing("should not write before the initial loading", async () => {
    localStorage.setItem("foo", "stored");
    document.body.innerHTML = html;
    target().value = "typed";
    target().dispatchEvent(new Event("input", { bubbles: true }));
    await flush();
    expect(localStorage.getItem("foo")).toBe("stored");
    expect(target().value).toBe("stored");
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
    expect({ ...localStorage }).toEqual({ foo: "foo value", bar: "typed" });
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
  it.failing(
    "should store the value changed by the value attribute",
    async () => {
      await render(html);
      target().setAttribute("value", "attr");
      await flush();
      expect(localStorage.getItem("foo")).toBe("attr");
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
