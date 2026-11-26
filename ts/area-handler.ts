import { buildWithIndex, remove } from "./arrays.js";
import {
  StoredValues,
  UpdateEventListenerCollection,
  WroteValues,
} from "./globals.js";
import { mapValues, setAll } from "./maps.js";
import { sleep } from "./promises.js";
import { byteLength } from "./strings.js";

type Sizes = Map<string, number>;

export interface AreaHandler {
  read(names: string[]): StoredValues | Promise<StoredValues>;
  write(items: WroteValues): void | Promise<void>;
  readBytes(names: string[]): Sizes | Promise<Sizes>;
  readTotalBytes(): number | Promise<number>;
  get quotaBytes(): number | undefined;
  get totalQuotaBytes(): number | undefined;
  onChange(callback: (update: WroteValues) => void | Promise<void>): {
    stop: () => void;
  };
}

const KIBI = 1024;
const MEBI = KIBI * KIBI;

const handlers = new Map<string, AreaHandler>();

export function registerHandler(area: string, handler: AreaHandler) {
  if (handlers.get(area)) {
    throw Error(`Already registered handler for "${area}"`);
  }
  handlers.set(area, handler);
}

function findHandler(area: string): AreaHandler | null {
  const h = handlers.get(area) ?? null;
  if (!h) console.warn(`No handler for "%s"`, area);
  return h;
}

export function listNames(): string[] {
  return [...handlers.keys()];
}

export class FacadeAreaHandler implements AreaHandler {
  private handler: AreaHandler | null = null;
  private readonly areaChangeListeners: ((
    newHandler: AreaHandler | null,
  ) => void)[] = [];

  readBytes(names: string[]): Sizes | Promise<Sizes> {
    return this.handler?.readBytes(names) ?? new Map();
  }

  readTotalBytes(): number | Promise<number> {
    return this.handler?.readTotalBytes() ?? 0;
  }

  get quotaBytes(): number | undefined {
    return this.handler?.quotaBytes;
  }

  get totalQuotaBytes(): number | undefined {
    return this.handler?.totalQuotaBytes;
  }

  updateArea(area: string | null) {
    this.handler = area ? findHandler(area) : null;
    for (const l of this.areaChangeListeners) l(this.handler);
  }

  read(names: string[]): Promise<StoredValues> | StoredValues {
    return this.handler?.read(names) ?? new Map();
  }

  async write(items: WroteValues): Promise<void> {
    const handler = this.handler;
    const listener = this.localListener;
    const writing = handler?.write(items);
    // Not after the write, because asynchronous writes may be delayed for long.
    const notifying = listener.dispatchEvent(items);
    try {
      await writing;
    } catch (error) {
      // The write error is thrown instead.
      notifying.catch(console.error);
      if (handler) await notifyStoredValues(handler, listener, items);
      throw error;
    }
    await notifying;
  }

  onChange(callback: (updates: WroteValues) => void | Promise<void>) {
    let nativeListening = this.handler?.onChange(callback);
    let localListening = this.localListener.addEventListener(callback);

    const areaChangeListener = (newHandler: AreaHandler | null) => {
      nativeListening?.stop();
      nativeListening = newHandler?.onChange(callback);
      localListening.stop();
      localListening = this.localListener.addEventListener(callback);
    };
    this.areaChangeListeners.push(areaChangeListener);
    return {
      stop: () => {
        nativeListening?.stop();
        localListening.stop();
        remove(this.areaChangeListeners, areaChangeListener);
      },
    };
  }

  private get localListener() {
    let listener = globalThis.storageForm.updateEventListeners.get(
      this.handler,
    );
    if (!listener) {
      listener = new UpdateEventListenerCollection();
      globalThis.storageForm.updateEventListeners.set(this.handler, listener);
    }
    return listener;
  }
}

/** Restores the values notified by a rejected write. */
async function notifyStoredValues(
  handler: AreaHandler,
  listener: UpdateEventListenerCollection,
  items: WroteValues,
) {
  try {
    const names = [...items.keys()];
    const values: WroteValues = new Map(names.map((n) => [n, undefined]));
    setAll(values, await handler.read(names));
    await listener.dispatchEvent(values);
  } catch (error) {
    console.error(error);
  }
}

export class WebStorageHandler implements AreaHandler {
  constructor(
    private readonly storage: Storage,
    // Optional parameters make the properties optional, but AreaHandler requires them.
    /* eslint-disable @typescript-eslint/no-useless-default-assignment */
    readonly quotaBytes: number | undefined = undefined,
    readonly totalQuotaBytes: number | undefined = undefined,
    /* eslint-enable @typescript-eslint/no-useless-default-assignment */
  ) {}

  readBytes(names: string[]): Sizes {
    return mapValues(this.read(names), (k, v) => byteLength(v));
  }

  readTotalBytes(): number {
    return this.allKeys().reduce(
      (acc, k) => acc + byteLength(this.storage.getItem(k) ?? ""),
      0,
    );
  }

  read(names: string[]): StoredValues {
    return names.reduce<StoredValues>((map, name) => {
      const v = this.storage.getItem(name);
      if (v != null) map.set(name, v);
      return map;
    }, new Map());
  }

  private allKeys(): string[] {
    return buildWithIndex(this.storage.length, (i) => {
      const k = this.storage.key(i);
      if (k === null) throw Error("Unexpected null key");
      return k;
    });
  }

  write(items: WroteValues): void {
    for (const [key, newValue] of items) {
      const oldValue = this.storage.getItem(key);
      if (oldValue === newValue) continue;
      if (newValue === undefined) {
        this.storage.removeItem(key);
      } else {
        this.storage.setItem(key, newValue);
      }
    }
  }

  onChange(callback: (updates: WroteValues) => void | Promise<void>) {
    const listener = ({ key, storageArea, newValue }: StorageEvent) => {
      if (storageArea !== this.storage) return;
      let updates: WroteValues;
      if (key === null) {
        updates = new Map(this.allKeys().map((k) => [k, undefined]));
      } else {
        updates = new Map([[key, newValue ?? undefined]]);
      }
      callback(updates)?.catch(console.error);
    };
    addEventListener("storage", listener);
    return {
      stop: () => {
        removeEventListener("storage", listener);
      },
    };
  }
}

if ("localStorage" in globalThis)
  registerHandler(
    "local-storage",
    new WebStorageHandler(localStorage, 10 * MEBI, 10 * MEBI),
  );
if ("sessionStorage" in globalThis)
  registerHandler(
    "session-storage",
    new WebStorageHandler(sessionStorage, 5 * MEBI, 5 * MEBI),
  );

export class ChromeStorageHandler implements AreaHandler {
  constructor(
    private readonly storage: chrome.storage.StorageArea,
    // Optional parameters make the properties optional, but AreaHandler requires them.
    /* eslint-disable @typescript-eslint/no-useless-default-assignment */
    readonly quotaBytes: number | undefined = undefined,
    readonly totalQuotaBytes: number | undefined = undefined,
    /* eslint-enable @typescript-eslint/no-useless-default-assignment */
  ) {}

  async readBytes(names: string[]): Promise<Sizes> {
    const entries = names.map(async (name) => {
      return [name, await this.storage.getBytesInUse(name)] as const;
    });
    return new Map(await Promise.all(entries));
  }

  readTotalBytes(): Promise<number> {
    return this.storage.getBytesInUse(null);
  }

  async read(names: string[] | null): Promise<StoredValues> {
    return Object.entries(await this.storage.get(names)).reduce<StoredValues>(
      (map, [k, v]) => {
        if (typeof v === "string") {
          map.set(k, v);
        } else {
          console.warn(
            "Unexpected type of stored value: type=%s, value=%o",
            typeof v,
            v,
          );
        }
        return map;
      },
      new Map(),
    );
  }

  async write(items: WroteValues): Promise<void> {
    const removeKeys: string[] = [];
    const setItems: Record<string, string> = {};
    for (const [key, value] of items.entries()) {
      if (value === undefined) removeKeys.push(key);
      else setItems[key] = value;
    }
    // Unlike Promise.all(), wait for both operations even if one of them fails.
    // Otherwise, the caller could start the next write during this one.
    const results = await Promise.allSettled([
      this.storage.remove(removeKeys),
      this.storage.set(setItems),
    ]);
    for (const r of results) if (r.status === "rejected") throw r.reason;
  }

  onChange(callback: (updates: WroteValues) => void | Promise<void>) {
    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
    ) => {
      const u = Object.entries(changes).reduce<WroteValues>(
        (acc, [key, { newValue }]) => {
          if (typeof newValue === "string" || typeof newValue === "undefined") {
            acc.set(key, newValue);
          } else {
            console.warn(
              "Unexpected type of stored value: type=%s, value=%o",
              typeof newValue,
              newValue,
            );
          }
          return acc;
        },
        new Map(),
      );
      callback(u)?.catch(console.error);
    };
    this.storage.onChanged.addListener(listener);
    return {
      stop: () => {
        this.storage.onChanged.removeListener(listener);
      },
    };
  }
}

export class BufferedWriteHandler implements AreaHandler {
  private readonly delayMillis: number;
  /** Entries which are not passed to the delegate yet. */
  private pendingEntries: WroteValues | null = null;
  /** Entries which the delegate is writing. */
  private writingEntries: WroteValues | null = null;
  private writePromise: Promise<void> = Promise.resolve();
  private lastWriteTime = 0;

  private static WRITE_INTERVAL_MERGIN_MILLIS = 300;

  constructor(
    private readonly delegate: AreaHandler,
    delayMillis: number,
  ) {
    this.delayMillis =
      delayMillis + BufferedWriteHandler.WRITE_INTERVAL_MERGIN_MILLIS;
  }

  get quotaBytes(): number | undefined {
    return this.delegate.quotaBytes;
  }
  get totalQuotaBytes(): number | undefined {
    return this.delegate.totalQuotaBytes;
  }

  readBytes(names: string[]): Promise<Sizes> | Sizes {
    return this.delegate.readBytes(names);
  }

  readTotalBytes(): Promise<number> | number {
    return this.delegate.readTotalBytes();
  }

  async read(names: string[]): Promise<StoredValues> {
    const values = new Map(await this.delegate.read(names));
    // After reading, to include the entries added while reading.
    for (const entries of [this.writingEntries, this.pendingEntries]) {
      if (!entries) continue;
      for (const name of names) {
        if (!entries.has(name)) continue;
        const value = entries.get(name);
        if (value === undefined) values.delete(name);
        else values.set(name, value);
      }
    }
    return values;
  }

  write(items: WroteValues): Promise<void> {
    if (this.pendingEntries) {
      setAll(this.pendingEntries, items);
      return this.writePromise;
    }

    const entries = new Map(items);
    this.pendingEntries = entries;
    // The callers of the previous write are the ones to handle its error.
    const previousWrite = this.writePromise.catch(() => undefined);
    this.writePromise = (async () => {
      await previousWrite;
      const diffTime = Date.now() - this.lastWriteTime;
      const sleepTime = this.delayMillis - diffTime;
      if (sleepTime > 0) await sleep(sleepTime);
      this.pendingEntries = null;
      this.writingEntries = entries;
      try {
        await this.delegate.write(entries);
      } finally {
        this.writingEntries = null;
        // Failed writes may also consume the rate limit of the storage.
        this.lastWriteTime = Date.now();
      }
    })();

    return this.writePromise;
  }

  onChange(callback: (updates: WroteValues) => void | Promise<void>): {
    stop: () => void;
  } {
    return this.delegate.onChange(callback);
  }
}

// chrome.storage is not available if the permission is not granted.
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
if ("chrome" in globalThis && chrome.storage) {
  if (chrome.storage.local)
    registerHandler(
      "chrome-local",
      new ChromeStorageHandler(
        chrome.storage.local,
        chrome.storage.local.QUOTA_BYTES,
        chrome.storage.local.QUOTA_BYTES,
      ),
    );
  if (chrome.storage.sync)
    registerHandler(
      "chrome-sync",
      new BufferedWriteHandler(
        new ChromeStorageHandler(
          chrome.storage.sync,
          chrome.storage.sync.QUOTA_BYTES_PER_ITEM,
          chrome.storage.sync.QUOTA_BYTES,
        ),
        Math.max(
          (60 * 60 * 1000) / chrome.storage.sync.MAX_WRITE_OPERATIONS_PER_HOUR,
          (60 * 1000) / chrome.storage.sync.MAX_WRITE_OPERATIONS_PER_MINUTE,
          200,
        ),
      ),
    );
}
/* eslint-enable @typescript-eslint/no-unnecessary-condition */
