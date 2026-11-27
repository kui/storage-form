import {
  addChangeListeners,
  dispatchChangeEvent,
  findStorageForm,
  parentOrShadowRootHost,
  storageFormMarker,
} from "../ts/elements.js";
import { flush } from "./helpers/dom.js";

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
