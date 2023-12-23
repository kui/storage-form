import { buildWithIndex, remove } from "./arrays.js";
import { setAll } from "./maps.js";
import { sleep } from "./promises.js";
import type {
  AreaBinderIO,
  ValueChanges,
  ValueChange,
  StoredValues,
  WroteValues,
} from "./storage-binder.js";

const handlers = new Map<string, AreaBinderIO>();

export function registerHandler(area: string, handler: AreaBinderIO) {
  if (handlers.get(area)) {
    throw Error(`Already registered handler for "${area}"`);
  }
  handlers.set(area, handler);
}

export function findHandler(area: string): AreaBinderIO | null {
  return handlers.get(area) ?? null;
}

export function listHandlers(): IterableIterator<[string, AreaBinderIO]> {
  return handlers.entries();
}

export class FacadeAreaBinderIO implements AreaBinderIO {
  private handler: AreaBinderIO | null = null;
  private readonly areaChangeListeners: ((
    newHandler: AreaBinderIO | null,
  ) => void)[] = [];

  updateArea(area: string | null) {
    this.handler = area ? findHandler(area) : null;
    for (const l of this.areaChangeListeners) l(this.handler);
  }

  read(names: string[]): Promise<StoredValues> | StoredValues {
    return this.handler?.read(names) ?? new Map();
  }

  readAll(): Promise<StoredValues> | StoredValues {
    return this.handler?.readAll() ?? new Map();
  }

  async write(items: WroteValues): Promise<void> {
    await this.handler?.write(items);
  }

  onChange(callback: (changes: ValueChanges) => void | Promise<void>) {
    let listening = this.handler?.onChange(callback);

    const listener = (newHandler: AreaBinderIO | null) => {
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

interface StorageChange {
  key: string | null;
  oldValue: string | null;
  newValue: string | null;
  storageArea: Storage | null;
}

export class WebStorageBinderIO implements AreaBinderIO {
  constructor(private readonly storage: Storage) {}

  read(names: string[]): StoredValues {
    return names.reduce<StoredValues>((map, name) => {
      const v = this.storage.getItem(name);
      if (v != null) map.set(name, v);
      return map;
    }, new Map());
  }

  readAll(): StoredValues {
    return this.read(this.allKeys());
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
      WebStorageBinderIO.dispatchStorageEvent({
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
    WebStorageBinderIO.storageEventListeners.push(listener);
    addEventListener("storage", listener);
    return {
      stop: () => {
        remove(WebStorageBinderIO.storageEventListeners, listener);
        removeEventListener("storage", listener);
      },
    };
  }

  static readonly storageEventListeners: ((change: StorageChange) => void)[] =
    [];
  static dispatchStorageEvent(change: StorageChange) {
    for (const l of WebStorageBinderIO.storageEventListeners) l(change);
  }
}

if ("localStorage" in globalThis)
  registerHandler("local-storage", new WebStorageBinderIO(localStorage));
if ("sessionStorage" in globalThis)
  registerHandler("session-storage", new WebStorageBinderIO(sessionStorage));

export class ChromeStorageBinderIO implements AreaBinderIO {
  constructor(protected readonly storage: chrome.storage.StorageArea) {}

  read(names: string[] | null): Promise<StoredValues> {
    return new Promise((resolve) => {
      this.storage.get(names, (items) => {
        const m = new Map<string, string>();
        for (const [key, value] of Object.entries(items)) {
          if (typeof value === "string") {
            m.set(key, value);
          } else {
            console.warn(
              "Unexpected type of stored value: type=%s, value=%o",
              typeof value,
              value,
            );
          }
        }
        resolve(m);
      });
    });
  }

  readAll(): Promise<StoredValues> {
    return this.read(null);
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

export class BufferedWriteBinderIO implements AreaBinderIO {
  private readonly delayMillis: number;
  private updatedEntries: WroteValues | null = null;
  private writePromise: Promise<void> = Promise.resolve();
  private lastWriteTime = 0;

  private static WRITE_INTERVAL_MERGIN_MILLIS = 300;

  constructor(
    private readonly delegate: AreaBinderIO,
    maxWritePerHour: number,
  ) {
    // how interval we should keep for a write operation.
    this.delayMillis =
      (60 * 60 * 1000) / maxWritePerHour +
      BufferedWriteBinderIO.WRITE_INTERVAL_MERGIN_MILLIS;
  }

  read(names: string[]): Promise<StoredValues> | StoredValues {
    return this.delegate.read(names);
  }

  readAll(): Promise<StoredValues> | StoredValues {
    return this.delegate.readAll();
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
      new ChromeStorageBinderIO(chrome.storage.local),
    );
  if (chrome.storage.sync)
    registerHandler(
      "chrome-sync",
      new BufferedWriteBinderIO(
        new ChromeStorageBinderIO(chrome.storage.sync),
        chrome.storage.sync.MAX_WRITE_OPERATIONS_PER_HOUR,
      ),
    );
}
/* eslint-enable @typescript-eslint/no-unnecessary-condition */
