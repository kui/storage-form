import { buildWithIndex, remove } from "./arrays.js";
import { type StorageChange } from "./globals.js";
import { mapValues, setAll } from "./maps.js";
import { sleep } from "./promises.js";
import { byteLength } from "./strings.js";

export interface ValueChange {
  oldValue?: string;
  newValue?: string;
}
export type ValueChanges = Map<string, ValueChange>;

export type StoredValues = Map<string, string>;
export type WroteValues = Map<string, string | undefined>;

type Sizes = Map<string, number>;

export interface AreaHandler {
  read(names: string[]): StoredValues | Promise<StoredValues>;
  write(items: WroteValues): void | Promise<void>;
  readBytes(names: string[]): Sizes | Promise<Sizes>;
  readTotalBytes(): number | Promise<number>;
  get quotaBytes(): number | undefined;
  get totalQuotaBytes(): number | undefined;
  onChange(callback: (changes: ValueChanges) => void | Promise<void>): {
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

export function findHandler(area: string): AreaHandler | null {
  const h = handlers.get(area) ?? null;
  if (!h) console.warn(`No handler for "%s"`, area);
  return h;
}

export function listAreas(): string[] {
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
    await this.handler?.write(items);
  }

  onChange(callback: (changes: ValueChanges) => void | Promise<void>) {
    let listening = this.handler?.onChange(callback);

    const listener = (newHandler: AreaHandler | null) => {
      listening?.stop();
      listening = newHandler?.onChange(callback);
    };
    this.areaChangeListeners.push(listener);

    return {
      stop: () => {
        listening?.stop();
        remove(this.areaChangeListeners, listener);
      },
    };
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
      this.dispatchStorageEvent({
        key,
        oldValue,
        newValue: newValue ?? null,
        storageArea: this.storage,
      });
    }
  }

  onChange(callback: (changes: ValueChanges) => void | Promise<void>) {
    const listener = ({
      key,
      storageArea,
      oldValue,
      newValue,
    }: StorageChange) => {
      if (storageArea !== this.storage) return;
      let changes: ValueChanges;
      if (key === null) {
        changes = new Map(this.allKeys().map((k) => [k, {}]));
      } else {
        const c: ValueChange = {};
        if (oldValue !== null) c.oldValue = oldValue;
        if (newValue !== null) c.newValue = newValue;
        changes = new Map([[key, c]]);
      }
      callback(changes)?.catch(console.error);
    };

    // We need to implement the listener because
    // "storage" event is not fired in the same window.
    this.storageEventListeners.push(listener);
    addEventListener("storage", listener);
    return {
      stop: () => {
        remove(this.storageEventListeners, listener);
        removeEventListener("storage", listener);
      },
    };
  }

  private get storageEventListeners() {
    return storageForm.webStorage.storageEventListeners;
  }
  private dispatchStorageEvent(change: StorageChange) {
    storageForm.webStorage.dispatchEvent(change);
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

  onChange(callback: (changes: ValueChanges) => void | Promise<void>) {
    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
    ) => {
      const c: ValueChanges = Object.entries(changes).reduce<ValueChanges>(
        (acc, [key, { oldValue, newValue }]) => {
          const d: ValueChange = {};
          if (oldValue != null) d.oldValue = oldValue as string;
          if (newValue != null) d.newValue = newValue as string;
          acc.set(key, d);
          return acc;
        },
        new Map(),
      );
      callback(c)?.catch(console.error);
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
    maxWritePerHour: number,
  ) {
    // how interval we should keep for a write operation.
    this.delayMillis =
      (60 * 60 * 1000) / maxWritePerHour +
      BufferedWriteHandler.WRITE_INTERVAL_MERGIN_MILLIS;
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

  onChange(callback: (changes: ValueChanges) => void | Promise<void>): {
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
        chrome.storage.sync.MAX_WRITE_OPERATIONS_PER_HOUR,
      ),
    );
}
/* eslint-enable @typescript-eslint/no-unnecessary-condition */
