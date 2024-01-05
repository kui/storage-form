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
    await Promise.all([
      this.handler?.write(items),
      this.localListener.dispatchEvent(items),
    ]);
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

export class WebStorageHandler implements AreaHandler {
  constructor(
    private readonly storage: Storage,
    readonly quotaBytes: number | undefined = undefined,
    readonly totalQuotaBytes: number | undefined = undefined,
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
    readonly quotaBytes: number | undefined = undefined,
    readonly totalQuotaBytes: number | undefined = undefined,
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
    await Promise.all([
      new Promise<void>((resolve) => {
        this.storage.remove(removeKeys, resolve);
      }),
      new Promise<void>((resolve) => {
        this.storage.set(setItems, resolve);
      }),
    ]);
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
  private updatedEntries: WroteValues | null = null;
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

  read(names: string[]): Promise<StoredValues> | StoredValues {
    return this.delegate.read(names);
  }

  write(items: WroteValues): Promise<void> {
    if (this.updatedEntries) {
      setAll(this.updatedEntries, items);
      return this.writePromise;
    }

    const updatedEntries = new Map(items);
    this.updatedEntries = updatedEntries;
    this.writePromise = (async () => {
      const diffTime = Date.now() - this.lastWriteTime;
      const sleepTime = this.delayMillis - diffTime;
      if (sleepTime > 0) await sleep(sleepTime);
      await this.delegate.write(updatedEntries);
      this.updatedEntries = null;
      this.lastWriteTime = Date.now();
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
