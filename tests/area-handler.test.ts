import {
  AreaHandler,
  BufferedWriteHandler,
  ChromeStorageHandler,
  FacadeAreaHandler,
  WebStorageHandler,
  listNames,
  registerHandler,
} from "../ts/area-handler.js";
import { WroteValues } from "../ts/globals.js";
import { withResolves } from "../ts/promises.js";
import { fakeChromeStorageArea } from "./helpers/chrome.js";
import { dump, flush, updateFromAnotherWindow } from "./helpers/dom.js";

const MEBI = 1024 * 1024;

function stubHandler() {
  const callbacks = new Set<(updates: WroteValues) => void | Promise<void>>();
  return {
    read: jest.fn(() => new Map([["k", "v"]])),
    write: jest.fn(),
    readBytes: jest.fn(() => new Map([["k", 1]])),
    readTotalBytes: jest.fn(() => 2),
    quotaBytes: 10,
    totalQuotaBytes: 20,
    onChange: (callback: (updates: WroteValues) => void | Promise<void>) => {
      callbacks.add(callback);
      return { stop: () => void callbacks.delete(callback) };
    },
    callbacks,
  } satisfies AreaHandler & { callbacks: unknown };
}

let areaCount = 0;
function registerStubHandler() {
  const name = `stub-${(areaCount++).toString()}`;
  const handler = stubHandler();
  registerHandler(name, handler);
  return { name, handler };
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("registerHandler", () => {
  it("should register the web storages by default", () => {
    expect(listNames().slice(0, 2)).toEqual([
      "local-storage",
      "session-storage",
    ]);
  });

  it("should add the area name to the list", () => {
    const { name } = registerStubHandler();
    expect(listNames()).toContain(name);
  });

  it("should throw an error if the area is already registered", () => {
    expect(() => {
      registerHandler("local-storage", stubHandler());
    }).toThrow(/already registered/i);
  });
});

describe("default handlers", () => {
  type AreaHandlerModule = typeof import("../ts/area-handler.js");

  function loadWithChrome(chrome: unknown): AreaHandlerModule {
    Object.assign(globalThis, { chrome });
    jest.resetModules();
    return jest.requireActual<AreaHandlerModule>("../ts/area-handler.js");
  }

  function facade(module: AreaHandlerModule, area: string) {
    const handler = new module.FacadeAreaHandler();
    handler.updateArea(area);
    return handler;
  }

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "chrome");
    jest.useRealTimers();
  });

  it.each([
    ["local-storage", 10 * MEBI],
    ["session-storage", 5 * MEBI],
  ])("should have the quota of %s", (area, quota) => {
    const handler = new FacadeAreaHandler();
    handler.updateArea(area);
    expect(handler.quotaBytes).toBe(quota);
    expect(handler.totalQuotaBytes).toBe(quota);
  });

  it("should ignore chrome without the storage permission", () => {
    expect(loadWithChrome({}).listNames()).toEqual([
      "local-storage",
      "session-storage",
    ]);
  });

  it("should register chrome storages with their quota", () => {
    const module = loadWithChrome({
      storage: {
        local: fakeChromeStorageArea({}, { QUOTA_BYTES: 100 }).area,
        sync: fakeChromeStorageArea(
          {},
          {
            QUOTA_BYTES: 50,
            QUOTA_BYTES_PER_ITEM: 5,
            MAX_WRITE_OPERATIONS_PER_HOUR: 1800,
            MAX_WRITE_OPERATIONS_PER_MINUTE: 120,
          },
        ).area,
      },
    });
    expect(module.listNames()).toEqual([
      "local-storage",
      "session-storage",
      "chrome-local",
      "chrome-sync",
    ]);
    const local = facade(module, "chrome-local");
    expect(local.quotaBytes).toBe(100);
    expect(local.totalQuotaBytes).toBe(100);
    const sync = facade(module, "chrome-sync");
    expect(sync.quotaBytes).toBe(5);
    expect(sync.totalQuotaBytes).toBe(50);
  });

  it.each([
    // [per hour, per minute, expected interval including the margin (300ms)]
    [1800, 120, 2000 + 300],
    [36000, 30, 2000 + 300],
    [3_600_000_000, 60_000_000, 200 + 300],
  ])(
    "should limit chrome-sync writing within %d/hour and %d/minute",
    async (perHour, perMinute, interval) => {
      jest.useFakeTimers();
      const { area, mock } = fakeChromeStorageArea(
        {},
        {
          MAX_WRITE_OPERATIONS_PER_HOUR: perHour,
          MAX_WRITE_OPERATIONS_PER_MINUTE: perMinute,
        },
      );
      const sync = facade(
        loadWithChrome({ storage: { sync: area } }),
        "chrome-sync",
      );
      await sync.write(new Map([["k", "v1"]]));
      expect(mock.set).toHaveBeenCalledTimes(1);
      const p = sync.write(new Map([["k", "v2"]]));
      await jest.advanceTimersByTimeAsync(interval - 1);
      expect(mock.set).toHaveBeenCalledTimes(1);
      await jest.advanceTimersByTimeAsync(1);
      await p;
      expect(mock.set).toHaveBeenCalledTimes(2);
    },
  );
});

describe("FacadeAreaHandler", () => {
  it("should behave as an empty storage without an area", async () => {
    const handler = new FacadeAreaHandler();
    expect(handler.read(["k"])).toEqual(new Map());
    expect(handler.readBytes(["k"])).toEqual(new Map());
    expect(handler.readTotalBytes()).toBe(0);
    expect(handler.quotaBytes).toBeUndefined();
    expect(handler.totalQuotaBytes).toBeUndefined();
    await expect(handler.write(new Map([["k", "v"]]))).resolves.toBeUndefined();
  });

  it("should delegate to the handler of the area", async () => {
    const { name, handler } = registerStubHandler();
    const facade = new FacadeAreaHandler();
    facade.updateArea(name);

    expect(facade.read(["k"])).toEqual(new Map([["k", "v"]]));
    expect(handler.read).toHaveBeenCalledWith(["k"]);
    expect(facade.readBytes(["k"])).toEqual(new Map([["k", 1]]));
    expect(handler.readBytes).toHaveBeenCalledWith(["k"]);
    expect(facade.readTotalBytes()).toBe(2);
    expect(facade.quotaBytes).toBe(10);
    expect(facade.totalQuotaBytes).toBe(20);

    const items = new Map([["k", "v2"]]);
    await facade.write(items);
    expect(handler.write).toHaveBeenCalledWith(items);
  });

  it("should warn and detach if the area is unknown", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation();
    const facade = new FacadeAreaHandler();
    facade.updateArea("local-storage");
    facade.updateArea("unknown");
    expect(warn).toHaveBeenCalledWith(expect.any(String), "unknown");
    expect(facade.quotaBytes).toBeUndefined();
  });

  it.each(["", null])("should detach without warnings if it is %p", (area) => {
    const warn = jest.spyOn(console, "warn").mockImplementation();
    const facade = new FacadeAreaHandler();
    facade.updateArea("local-storage");
    facade.updateArea(area);
    expect(facade.quotaBytes).toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
  });

  describe("#onChange", () => {
    it("should notify writes by other facades of the same area", async () => {
      const { name } = registerStubHandler();
      const a = new FacadeAreaHandler();
      const b = new FacadeAreaHandler();
      const other = new FacadeAreaHandler();
      a.updateArea(name);
      b.updateArea(name);
      other.updateArea("local-storage");
      const callback = jest.fn();
      const otherCallback = jest.fn();
      b.onChange(callback);
      other.onChange(otherCallback);

      const items = new Map([["k", "v"]]);
      await a.write(items);
      expect(callback.mock.calls).toEqual([[items]]);
      expect(otherCallback).not.toHaveBeenCalled();
    });

    it("should notify changes by the storage", () => {
      const { name, handler } = registerStubHandler();
      const facade = new FacadeAreaHandler();
      facade.updateArea(name);
      const callback = jest.fn();
      facade.onChange(callback);
      expect([...handler.callbacks]).toEqual([callback]);
    });

    it("should follow the area change", async () => {
      const before = registerStubHandler();
      const after = registerStubHandler();
      const facade = new FacadeAreaHandler();
      const callback = jest.fn();
      facade.onChange(callback);
      facade.updateArea(before.name);
      facade.updateArea(after.name);

      expect(before.handler.callbacks.size).toBe(0);
      expect(after.handler.callbacks.size).toBe(1);

      const writer = new FacadeAreaHandler();
      writer.updateArea(before.name);
      await writer.write(new Map([["k", "before"]]));
      expect(callback).not.toHaveBeenCalled();
      writer.updateArea(after.name);
      await writer.write(new Map([["k", "after"]]));
      expect(callback.mock.calls).toEqual([[new Map([["k", "after"]])]]);
    });

    it("should not notify after stopped", async () => {
      const { name, handler } = registerStubHandler();
      const another = registerStubHandler();
      const facade = new FacadeAreaHandler();
      facade.updateArea(name);
      const callback = jest.fn();
      facade.onChange(callback).stop();
      expect(handler.callbacks.size).toBe(0);
      await facade.write(new Map([["k", "v"]]));
      facade.updateArea(another.name);
      expect(another.handler.callbacks.size).toBe(0);
      await facade.write(new Map([["k", "v"]]));
      expect(callback).not.toHaveBeenCalled();
    });
  });
});

describe("WebStorageHandler", () => {
  it("should read only existing values", () => {
    localStorage.setItem("a", "1");
    localStorage.setItem("empty", "");
    const handler = new WebStorageHandler(localStorage);
    expect(handler.read(["a", "empty", "none"])).toEqual(
      new Map([
        ["a", "1"],
        ["empty", ""],
      ]),
    );
  });

  it("should read UTF-8 bytes", () => {
    localStorage.setItem("a", "あ");
    localStorage.setItem("b", "12");
    const handler = new WebStorageHandler(localStorage);
    expect(handler.readBytes(["a", "none"])).toEqual(new Map([["a", 3]]));
    expect(handler.readTotalBytes()).toBe(5);
  });

  it("should set and remove values", () => {
    localStorage.setItem("remove", "1");
    localStorage.setItem("update", "1");
    const handler = new WebStorageHandler(localStorage);
    handler.write(
      new Map([
        ["remove", undefined],
        ["update", "2"],
        ["add", ""],
      ]),
    );
    expect(dump(localStorage)).toEqual({ update: "2", add: "" });
  });

  it("should not set the same value", () => {
    localStorage.setItem("a", "1");
    const setItem = jest.spyOn(Storage.prototype, "setItem");
    new WebStorageHandler(localStorage).write(new Map([["a", "1"]]));
    expect(setItem).not.toHaveBeenCalled();
  });

  describe("#onChange", () => {
    it("should notify changes by another window until stopped", async () => {
      const callback = jest.fn();
      const listening = new WebStorageHandler(localStorage).onChange(callback);
      await updateFromAnotherWindow(localStorage, "a", "1");
      await updateFromAnotherWindow(localStorage, "a", null);
      expect(callback.mock.calls).toEqual([
        [new Map([["a", "1"]])],
        [new Map([["a", undefined]])],
      ]);
      listening.stop();
      await updateFromAnotherWindow(localStorage, "a", "2");
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it("should ignore changes of other storages", async () => {
      const callback = jest.fn();
      const listening = new WebStorageHandler(localStorage).onChange(callback);
      await updateFromAnotherWindow(sessionStorage, "a", "1");
      listening.stop();
      expect(callback).not.toHaveBeenCalled();
    });

    it("should notify empty updates if the storage is cleared", () => {
      const callback = jest.fn();
      const listening = new WebStorageHandler(localStorage).onChange(callback);
      dispatchEvent(
        new StorageEvent("storage", { key: null, storageArea: localStorage }),
      );
      listening.stop();
      expect(callback.mock.calls).toEqual([[new Map()]]);
    });

    it("should log an error if the callback is rejected", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation();
      const error = Error("test");
      const listening = new WebStorageHandler(localStorage).onChange(() =>
        Promise.reject(error),
      );
      await updateFromAnotherWindow(localStorage, "a", "1");
      listening.stop();
      expect(spy).toHaveBeenCalledWith(error);
    });
  });
});

describe("ChromeStorageHandler", () => {
  it("should read values", async () => {
    const { area } = fakeChromeStorageArea({ a: "1", b: "2", c: "3" });
    const handler = new ChromeStorageHandler(area);
    expect(await handler.read(["a", "b", "none"])).toEqual(
      new Map([
        ["a", "1"],
        ["b", "2"],
      ]),
    );
  });

  it("should warn and ignore non-string values", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation();
    const { area } = fakeChromeStorageArea({ a: 1, b: "2" });
    const handler = new ChromeStorageHandler(area);
    expect(await handler.read(null)).toEqual(new Map([["b", "2"]]));
    expect(warn).toHaveBeenCalledWith(expect.any(String), "number", 1);
  });

  it("should read bytes", async () => {
    const { area } = fakeChromeStorageArea({ a: "12", b: "345" });
    const handler = new ChromeStorageHandler(area);
    expect(await handler.readBytes(["a", "none"])).toEqual(
      new Map([
        ["a", 3],
        ["none", 0],
      ]),
    );
    expect(await handler.readTotalBytes()).toBe(7);
  });

  it("should set and remove values", async () => {
    const { area, values } = fakeChromeStorageArea({ a: "1", b: "2" });
    await new ChromeStorageHandler(area).write(
      new Map([
        ["a", undefined],
        ["b", "3"],
        ["c", ""],
      ]),
    );
    expect(values).toEqual({ b: "3", c: "" });
  });

  it.each(["set", "remove"] as const)(
    "should reject if %s is rejected",
    async (method) => {
      const { area, mock } = fakeChromeStorageArea();
      mock[method].mockRejectedValueOnce(Error("test"));
      await expect(
        new ChromeStorageHandler(area).write(new Map([["a", "1"]])),
      ).rejects.toThrow("test");
    },
  );

  it.each([
    ["set", "remove"],
    ["remove", "set"],
  ] as const)(
    "should wait for %s to end even if %s is rejected",
    async (pending, rejected) => {
      const { area, mock } = fakeChromeStorageArea();
      const { promise, resolve } = withResolves();
      mock[pending].mockReturnValueOnce(promise);
      mock[rejected].mockRejectedValueOnce(Error("test"));
      const settled = jest.fn();
      const p = new ChromeStorageHandler(area).write(new Map([["a", "1"]]));
      p.then(settled, settled);
      await flush();
      expect(settled).not.toHaveBeenCalled();
      resolve();
      await expect(p).rejects.toThrow("test");
    },
  );

  describe("#onChange", () => {
    it("should notify changes until stopped", () => {
      const { area, emit } = fakeChromeStorageArea();
      const callback = jest.fn();
      const listening = new ChromeStorageHandler(area).onChange(callback);
      emit({ a: { newValue: "1" }, b: { oldValue: "2" } });
      expect(callback.mock.calls).toEqual([
        [
          new Map([
            ["a", "1"],
            ["b", undefined],
          ]),
        ],
      ]);
      listening.stop();
      emit({ a: { newValue: "2" } });
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should warn and ignore non-string values", () => {
      const warn = jest.spyOn(console, "warn").mockImplementation();
      const { area, emit } = fakeChromeStorageArea();
      const callback = jest.fn();
      new ChromeStorageHandler(area).onChange(callback);
      emit({ a: { newValue: 1 }, b: { newValue: "2" } });
      expect(callback.mock.calls).toEqual([[new Map([["b", "2"]])]]);
      expect(warn).toHaveBeenCalledWith(expect.any(String), "number", 1);
    });

    it("should log an error if the callback is rejected", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation();
      const error = Error("test");
      const { area, emit } = fakeChromeStorageArea();
      new ChromeStorageHandler(area).onChange(() => Promise.reject(error));
      emit({ a: { newValue: "1" } });
      await flush();
      expect(spy).toHaveBeenCalledWith(error);
    });
  });
});

describe("BufferedWriteHandler", () => {
  it("should delegate except writing", () => {
    const delegate = stubHandler();
    const handler = new BufferedWriteHandler(delegate, 200);
    expect(handler.quotaBytes).toBe(10);
    expect(handler.totalQuotaBytes).toBe(20);
    expect(handler.read(["k"])).toEqual(new Map([["k", "v"]]));
    expect(delegate.read).toHaveBeenCalledWith(["k"]);
    expect(handler.readBytes(["k"])).toEqual(new Map([["k", 1]]));
    expect(delegate.readBytes).toHaveBeenCalledWith(["k"]);
    expect(handler.readTotalBytes()).toBe(2);
    const callback = jest.fn();
    const listening = handler.onChange(callback);
    expect([...delegate.callbacks]).toEqual([callback]);
    listening.stop();
    expect(delegate.callbacks.size).toBe(0);
  });

  describe("#write", () => {
    // The margin (300ms) is added to the delay.
    const INTERVAL = 200 + 300;

    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it("should write immediately at first", async () => {
      const delegate = stubHandler();
      const handler = new BufferedWriteHandler(delegate, 200);
      await handler.write(new Map([["n1", "v1"]]));
      expect(delegate.write.mock.calls).toEqual([[new Map([["n1", "v1"]])]]);
    });

    it("should delay and merge the following writes", async () => {
      const delegate = stubHandler();
      const handler = new BufferedWriteHandler(delegate, 200);
      await handler.write(new Map([["n1", "v1"]]));
      const p2 = handler.write(
        new Map([
          ["n2", "v2"],
          ["n3", "old"],
        ]),
      );
      const p3 = handler.write(
        new Map([
          ["n3", "new"],
          ["n4", undefined],
        ]),
      );

      await jest.advanceTimersByTimeAsync(INTERVAL - 1);
      expect(delegate.write).toHaveBeenCalledTimes(1);
      await jest.advanceTimersByTimeAsync(1);
      await Promise.all([p2, p3]);
      expect(delegate.write).toHaveBeenCalledTimes(2);
      expect(delegate.write).toHaveBeenLastCalledWith(
        new Map([
          ["n2", "v2"],
          ["n3", "new"],
          ["n4", undefined],
        ]),
      );
    });

    it("should write immediately after the interval", async () => {
      const delegate = stubHandler();
      const handler = new BufferedWriteHandler(delegate, 200);
      await handler.write(new Map([["n1", "v1"]]));
      await jest.advanceTimersByTimeAsync(INTERVAL);
      await handler.write(new Map([["n2", "v2"]]));
      expect(delegate.write).toHaveBeenCalledTimes(2);
    });

    it("should not modify the passed items", async () => {
      const handler = new BufferedWriteHandler(stubHandler(), 200);
      await handler.write(new Map([["n1", "v1"]]));
      const items = new Map([["n2", "v2"]]);
      const p = handler.write(items);
      void handler.write(new Map([["n3", "v3"]]));
      await jest.advanceTimersByTimeAsync(INTERVAL);
      await p;
      expect(items).toEqual(new Map([["n2", "v2"]]));
    });

    it("should reject if the delegate is rejected", async () => {
      const delegate = stubHandler();
      delegate.write.mockRejectedValueOnce(Error("test"));
      const handler = new BufferedWriteHandler(delegate, 200);
      await expect(handler.write(new Map([["n1", "v1"]]))).rejects.toThrow(
        "test",
      );
    });

    it("should write again after a rejected write", async () => {
      const delegate = stubHandler();
      delegate.write.mockRejectedValueOnce(Error("test"));
      const handler = new BufferedWriteHandler(delegate, 200);
      await expect(handler.write(new Map([["n1", "v1"]]))).rejects.toThrow();
      const p = handler.write(new Map([["n2", "v2"]]));
      await jest.advanceTimersByTimeAsync(INTERVAL - 1);
      expect(delegate.write).toHaveBeenCalledTimes(1);
      await jest.advanceTimersByTimeAsync(1);
      await p;
      expect(delegate.write.mock.calls).toEqual([
        [new Map([["n1", "v1"]])],
        [new Map([["n2", "v2"]])],
      ]);
    });

    it("should reject all the merged writes if the delegate is rejected", async () => {
      const delegate = stubHandler();
      const handler = new BufferedWriteHandler(delegate, 200);
      await handler.write(new Map([["n1", "v1"]]));
      delegate.write.mockRejectedValueOnce(Error("test"));
      const p = Promise.allSettled([
        handler.write(new Map([["n2", "v2"]])),
        handler.write(new Map([["n3", "v3"]])),
      ]);
      await jest.advanceTimersByTimeAsync(INTERVAL);
      expect((await p).map((r) => r.status)).toEqual(["rejected", "rejected"]);
    });

    it("should merge writes in the same task", async () => {
      const delegate = stubHandler();
      const handler = new BufferedWriteHandler(delegate, 200);
      await Promise.all([
        handler.write(new Map([["n1", "v1"]])),
        handler.write(new Map([["n2", "v2"]])),
      ]);
      expect(delegate.write.mock.calls).toEqual([
        [
          new Map([
            ["n1", "v1"],
            ["n2", "v2"],
          ]),
        ],
      ]);
    });

    it("should merge items added while sleeping without extending the delay", async () => {
      const delegate = stubHandler();
      const handler = new BufferedWriteHandler(delegate, 200);
      await handler.write(new Map([["n1", "v1"]]));
      const p2 = handler.write(new Map([["n2", "v2"]]));
      await jest.advanceTimersByTimeAsync(INTERVAL - 1);
      const p3 = handler.write(new Map([["n3", "v3"]]));
      await jest.advanceTimersByTimeAsync(1);
      await Promise.all([p2, p3]);
      expect(delegate.write).toHaveBeenCalledTimes(2);
      expect(delegate.write).toHaveBeenLastCalledWith(
        new Map([
          ["n2", "v2"],
          ["n3", "v3"],
        ]),
      );
    });

    describe("while the delegate is writing", () => {
      /** A handler whose delegate writes are settled by the test. */
      function pendingHandler() {
        const delegate = stubHandler();
        const writes: {
          items: WroteValues;
          resolve: () => void;
          reject: (reason: unknown) => void;
        }[] = [];
        delegate.write.mockImplementation((items: WroteValues) => {
          const { promise, resolve, reject } = withResolves();
          // Copy the items because they could be modified after the call.
          writes.push({ items: new Map(items), resolve, reject });
          return promise;
        });
        return { handler: new BufferedWriteHandler(delegate, 200), writes };
      }

      it("should write items added while writing", async () => {
        const { handler, writes } = pendingHandler();
        const p1 = handler.write(new Map([["k", "v1"]]));
        await jest.advanceTimersByTimeAsync(0);
        const p2 = handler.write(new Map([["k", "v2"]]));
        writes[0].resolve();
        await p1;
        await jest.advanceTimersByTimeAsync(INTERVAL);
        expect(writes.map((w) => w.items)).toEqual([
          new Map([["k", "v1"]]),
          new Map([["k", "v2"]]),
        ]);
        writes[1].resolve();
        await p2;
      });

      it("should not resolve the added write by the running one", async () => {
        const { handler, writes } = pendingHandler();
        void handler.write(new Map([["n1", "v1"]]));
        await jest.advanceTimersByTimeAsync(0);
        const done = jest.fn();
        void handler.write(new Map([["n2", "v2"]])).then(done);
        writes[0].resolve();
        await jest.advanceTimersByTimeAsync(INTERVAL);
        expect(done).not.toHaveBeenCalled();
        writes[1].resolve();
        await jest.advanceTimersByTimeAsync(0);
        expect(done).toHaveBeenCalled();
      });

      it("should not start the next write until the running one ends and the interval passes", async () => {
        const { handler, writes } = pendingHandler();
        void handler.write(new Map([["n1", "v1"]]));
        await jest.advanceTimersByTimeAsync(0);
        void handler.write(new Map([["n2", "v2"]]));
        await jest.advanceTimersByTimeAsync(INTERVAL * 3);
        expect(writes).toHaveLength(1);
        writes[0].resolve();
        await jest.advanceTimersByTimeAsync(INTERVAL - 1);
        expect(writes).toHaveLength(1);
        await jest.advanceTimersByTimeAsync(1);
        expect(writes).toHaveLength(2);
      });

      it("should merge items added many times into the next write", async () => {
        const { handler, writes } = pendingHandler();
        void handler.write(new Map([["n1", "v1"]]));
        await jest.advanceTimersByTimeAsync(0);
        const promises = [
          handler.write(new Map([["n2", "old"]])),
          handler.write(new Map([["n3", "v3"]])),
        ];
        await jest.advanceTimersByTimeAsync(INTERVAL);
        promises.push(handler.write(new Map([["n2", "new"]])));
        writes[0].resolve();
        await jest.advanceTimersByTimeAsync(1);
        promises.push(handler.write(new Map([["n4", undefined]])));
        await jest.advanceTimersByTimeAsync(INTERVAL - 1);
        expect(writes.slice(1).map((w) => w.items)).toEqual([
          new Map([
            ["n2", "new"],
            ["n3", "v3"],
            ["n4", undefined],
          ]),
        ]);
        writes[1].resolve();
        await Promise.all(promises);
        await jest.advanceTimersByTimeAsync(INTERVAL);
        expect(writes).toHaveLength(2);
      });

      it("should keep the order and the interval over three writes", async () => {
        const { handler, writes } = pendingHandler();
        void handler.write(new Map([["k", "1"]]));
        await jest.advanceTimersByTimeAsync(0);
        void handler.write(new Map([["k", "2"]]));
        writes[0].resolve();
        await jest.advanceTimersByTimeAsync(INTERVAL);
        void handler.write(new Map([["k", "3"]]));
        await jest.advanceTimersByTimeAsync(INTERVAL);
        expect(writes).toHaveLength(2);
        writes[1].resolve();
        await jest.advanceTimersByTimeAsync(INTERVAL - 1);
        expect(writes).toHaveLength(2);
        await jest.advanceTimersByTimeAsync(1);
        expect(writes.map((w) => w.items.get("k"))).toEqual(["1", "2", "3"]);
      });

      it("should write the added items even if the running write is rejected", async () => {
        const { handler, writes } = pendingHandler();
        const p1 = handler.write(new Map([["n1", "v1"]]));
        await jest.advanceTimersByTimeAsync(0);
        const p2 = handler.write(new Map([["n2", "v2"]]));
        writes[0].reject(Error("test"));
        await expect(p1).rejects.toThrow("test");
        await jest.advanceTimersByTimeAsync(INTERVAL - 1);
        expect(writes).toHaveLength(1);
        await jest.advanceTimersByTimeAsync(1);
        expect(writes[1].items).toEqual(new Map([["n2", "v2"]]));
        writes[1].resolve();
        await expect(p2).resolves.toBeUndefined();
      });
    });
  });
});
