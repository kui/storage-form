import {
  addChangeListeners,
  dispatchChangeEvent,
  parentOrShadowRootHost,
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
