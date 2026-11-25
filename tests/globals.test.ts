import {
  UpdateEventListenerCollection,
  allCustomElementsDefinedEvent,
} from "../ts/globals.js";

describe("globalThis.storageForm", () => {
  it("should be shared even if the module is loaded twice", () => {
    const first = globalThis.storageForm;
    jest.resetModules();
    jest.requireActual("../ts/globals.js");
    expect(globalThis.storageForm).toBe(first);
  });
});

describe("UpdateEventListenerCollection", () => {
  it("should dispatch to all listeners", async () => {
    const collection = new UpdateEventListenerCollection();
    const l1 = jest.fn();
    const l2 = jest.fn();
    collection.addEventListener(l1);
    collection.addEventListener(l2);
    const updates = new Map([["k", "v"]]);
    await collection.dispatchEvent(updates);
    expect(l1.mock.calls).toEqual([[updates]]);
    expect(l2.mock.calls).toEqual([[updates]]);
  });

  it("should not dispatch to stopped listeners", async () => {
    const collection = new UpdateEventListenerCollection();
    const stopped = jest.fn();
    const active = jest.fn();
    const listening = collection.addEventListener(stopped);
    collection.addEventListener(active);
    expect(listening.stop()).toBe(true);
    expect(listening.stop()).toBe(false);
    await collection.dispatchEvent(new Map());
    expect(stopped).not.toHaveBeenCalled();
    expect(active).toHaveBeenCalledTimes(1);
  });

  it("should wait for async listeners", async () => {
    const collection = new UpdateEventListenerCollection();
    let done = false;
    collection.addEventListener(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      done = true;
    });
    await collection.dispatchEvent(new Map());
    expect(done).toBe(true);
  });

  it("should reject if a listener is rejected", async () => {
    const collection = new UpdateEventListenerCollection();
    collection.addEventListener(() => Promise.reject(Error("test")));
    await expect(collection.dispatchEvent(new Map())).rejects.toThrow("test");
  });
});

describe("allCustomElementsDefinedEvent", () => {
  it("should call listeners on dispatch", () => {
    const listener = jest.fn();
    allCustomElementsDefinedEvent.listeners.push(listener);
    expect(listener).not.toHaveBeenCalled();
    allCustomElementsDefinedEvent.dispatchEvent();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
