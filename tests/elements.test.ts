import {
  addChangeListeners,
  afterPropagation,
  dispatchChangeEvent,
  findStorageForm,
  isValid,
  parentOrShadowRootHost,
  storageFormMarker,
} from "../ts/elements.js";
import { flush, query } from "./helpers/dom.js";

describe("dispatchChangeEvent", () => {
  it("should dispatch a bubbling change event on each element", () => {
    const parent = document.createElement("div");
    const e1 = parent.appendChild(document.createElement("input"));
    const e2 = parent.appendChild(document.createElement("input"));
    const targets: unknown[] = [];
    parent.addEventListener("change", (e) => targets.push(e.target));
    dispatchChangeEvent(e1, e2);
    expect(targets).toEqual([e1, e2]);
  });
});

describe("addChangeListeners", () => {
  it("should listen to change and input events until stopped", () => {
    const element = document.createElement("input");
    const types: string[] = [];
    const listening = addChangeListeners(element, (e) => {
      types.push(e.type);
    });
    element.dispatchEvent(new Event("change"));
    element.dispatchEvent(new Event("input"));
    expect(types).toEqual(["change", "input"]);

    listening.stop();
    element.dispatchEvent(new Event("change"));
    element.dispatchEvent(new Event("input"));
    expect(types).toHaveLength(2);
  });

  it("should log an error if the listener is rejected", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation();
    const error = Error("test");
    const element = document.createElement("input");
    addChangeListeners(element, () => Promise.reject(error));
    element.dispatchEvent(new Event("change"));
    await flush();
    expect(spy).toHaveBeenCalledWith(error);
  });
});

describe("parentOrShadowRootHost", () => {
  it("should return the parent element", () => {
    const parent = document.createElement("div");
    const child = parent.appendChild(document.createElement("span"));
    expect(parentOrShadowRootHost(child)).toBe(parent);
  });

  it("should return the shadow host at the top of a shadow tree", () => {
    const host = document.createElement("div");
    const child = host
      .attachShadow({ mode: "open" })
      .appendChild(document.createElement("span"));
    expect(parentOrShadowRootHost(child)).toBe(host);
  });

  it("should return null if there are no parents", () => {
    expect(parentOrShadowRootHost(document.createElement("div"))).toBeNull();
    expect(parentOrShadowRootHost(document.documentElement)).toBeNull();
  });
});

describe("findStorageForm", () => {
  /** A fake storage form, like the elements made by mixinStorageForm. */
  function form(area?: string): HTMLElement {
    const e = document.createElement("div");
    Object.defineProperties(e, {
      [storageFormMarker]: { value: true },
      storageArea: { get: () => e.getAttribute("storage-area") ?? "" },
    });
    if (area !== undefined) e.setAttribute("storage-area", area);
    return e;
  }
  /** Compares elements by identity, because toEqual uses isEqualNode. */
  function expectResult(
    actual: ReturnType<typeof findStorageForm>,
    owner: HTMLElement | null,
    forms: HTMLElement[],
  ) {
    expect(actual.owner).toBe(owner);
    expect(actual.forms).toHaveLength(forms.length);
    forms.forEach((f, i) => {
      expect(actual.forms[i]).toBe(f);
    });
  }
  const across = { crossShadowRoots: true };
  const within = { crossShadowRoots: false };

  it("should return the nearest form with the area", () => {
    const outer = form("local-storage");
    const inner = outer.appendChild(form("session-storage"));
    const child = inner
      .appendChild(document.createElement("div"))
      .appendChild(document.createElement("span"));
    expectResult(findStorageForm(child, within), inner, [inner]);
  });

  it("should skip forms without the area as owners, but return them", () => {
    const outer = form("local-storage");
    const inner = outer.appendChild(form());
    const child = inner.appendChild(document.createElement("span"));
    expectResult(findStorageForm(child, within), outer, [inner, outer]);
  });

  it("should not count elements which only have storageArea", () => {
    const outer = form("local-storage");
    const notForm = outer.appendChild(
      Object.assign(document.createElement("div"), {
        storageArea: "session-storage",
      }),
    );
    const child = notForm.appendChild(document.createElement("span"));
    expectResult(findStorageForm(child, within), outer, [outer]);
  });

  it("should return no owners without forms with the area", () => {
    const outer = form();
    const child = outer.appendChild(document.createElement("span"));
    expectResult(findStorageForm(child, within), null, [outer]);
  });

  it("should cross shadow roots only if specified", () => {
    const outer = form("local-storage");
    const child = outer
      .appendChild(document.createElement("div"))
      .attachShadow({ mode: "open" })
      .appendChild(document.createElement("span"));
    expect(findStorageForm(child, across).owner).toBe(outer);
    expectResult(findStorageForm(child, within), null, []);
  });
});

describe("afterPropagation", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("should call back after the listeners on the whole path", () => {
    document.body.innerHTML = "<div><input></div>";
    const div = query("div");
    const order: string[] = [];
    div.addEventListener("input", (e) => {
      order.push("div");
      afterPropagation(e, () => order.push("callback"));
    });
    document.body.addEventListener("input", () => order.push("body"));
    addEventListener("input", () => order.push("window"), { once: true });
    query("input").dispatchEvent(new Event("input", { bubbles: true }));
    expect(order).toEqual(["div", "body", "window", "callback"]);
  });

  it("should call back once, after a nested dispatch of the same type", () => {
    document.body.innerHTML = "<div><input></div>";
    const div = query("div");
    const input = query("input");
    const order: string[] = [];
    let isNested = false;
    div.addEventListener("input", (e) => {
      if (isNested) return;
      afterPropagation(e, () => order.push("callback"));
      isNested = true;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      order.push("nested");
    });
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(order).toEqual(["nested", "callback"]);
  });

  it("should call back in a task if the propagation is stopped", async () => {
    document.body.innerHTML = "<div><input></div>";
    const div = query("div");
    const callback = jest.fn();
    div.addEventListener("input", (e) => {
      afterPropagation(e, callback);
    });
    document.body.addEventListener("input", (e) => {
      e.stopPropagation();
    });
    query("input").dispatchEvent(new Event("input", { bubbles: true }));
    expect(callback).not.toHaveBeenCalled();
    await flush();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should call back at once for a non-bubbling event", () => {
    const element = document.createElement("div");
    const callback = jest.fn();
    element.addEventListener("input", (e) => {
      afterPropagation(e, callback);
    });
    element.dispatchEvent(new Event("input"));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should call back at once on the root of a detached tree", () => {
    const element = document.createElement("div");
    const callback = jest.fn();
    element.addEventListener("input", (e) => {
      afterPropagation(e, callback);
    });
    element
      .appendChild(document.createElement("input"))
      .dispatchEvent(new Event("input", { bubbles: true }));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should end at the shadow root for a non-composed event", () => {
    document.body.innerHTML = "<div></div>";
    const root = query("div").attachShadow({ mode: "open" });
    const span = root.appendChild(document.createElement("span"));
    const input = span.appendChild(document.createElement("input"));
    const order: string[] = [];
    span.addEventListener("change", (e) => {
      afterPropagation(e, () => order.push("callback"));
    });
    root.addEventListener("change", () => order.push("root"));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    expect(order).toEqual(["root", "callback"]);
  });
});

describe("isValid", () => {
  it("should tell the validity without an invalid event", () => {
    const input = document.createElement("input");
    const invalid = jest.fn();
    input.addEventListener("invalid", invalid);
    expect(isValid(input)).toBe(true);
    input.setCustomValidity("bad");
    expect(isValid(input)).toBe(false);
    expect(invalid).not.toHaveBeenCalled();
  });

  it("should treat elements barred from validation as valid", () => {
    const input = document.createElement("input");
    input.setCustomValidity("bad");
    input.disabled = true;
    expect(isValid(input)).toBe(true);
    expect(isValid(document.createElement("output"))).toBe(true);
    expect(isValid(document.createElement("div"))).toBe(true);
  });
});
