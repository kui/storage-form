import * as utils from "./utils";

export type AreaName =
  | "local-storage"
  | "session-storage"
  | "chrome-local"
  | "chrome-sync";

interface AreaHandler {
  read(names: string[]): Promise<Record<string, string>>;
  write(items: Record<string, string>): Promise<void>;
}

const handlers: Record<string, AreaHandler> = {};

export function registerHandler(area: AreaName, handler: AreaHandler) {
  if (handlers[area]) {
    throw Error(`Already registered handler for "${area}"`);
  }
  handlers[area] = handler;
}

export function findHandler(area: string) {
  return handlers[area];
}

export function listHandlers() {
  return Object.entries(handlers);
}

//

export class WebStorageAreaHandler implements AreaHandler {
  constructor(private readonly storage: Storage) {}

  read(names: string[]): Promise<Record<string, string>> {
    const r = names
      .map((n) => [n, this.storage.getItem(n)] as [string, string | null])
      .reduce(
        (o, [n, v]) => {
          if (v != null) o[n] = v;
          return o;
        },
        {} as Record<string, string>,
      );
    return Promise.resolve(r);
  }

  write(items: Record<string, string>): Promise<void> {
    for (const [n, v] of Object.entries(items)) this.storage.setItem(n, v);
    return Promise.resolve();
  }
}

if ("localStorage" in globalThis)
  registerHandler("local-storage", new WebStorageAreaHandler(localStorage));
if ("sessionStorage" in globalThis)
  registerHandler("session-storage", new WebStorageAreaHandler(sessionStorage));

export class ChromeStorageAreaHandler implements AreaHandler {
  constructor(protected readonly storage: chrome.storage.StorageArea) {}

  read(names: string[]): Promise<Record<string, string>> {
    return new Promise((resolve) => {
      this.storage.get(names, (values: Record<string, string>) =>
        resolve(values),
      );
    });
  }

  write(items: Record<string, string>): Promise<void> {
    return new Promise((resolve) => {
      this.storage.set(items, resolve);
    });
  }
}

export class BufferedWriteAreaHandler implements AreaHandler {
  private readonly delayMillis: number;
  private updatedEntries: Record<string, string> | null = null;
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
      BufferedWriteAreaHandler.WRITE_INTERVAL_MERGIN_MILLIS;
  }

  read(names: string[]): Promise<Record<string, string>> {
    return this.delegate.read(names);
  }

  write(items: Record<string, string>) {
    if (this.updatedEntries) {
      Object.assign(this.updatedEntries, items);
      return this.writePromise;
    }

    const updatedEntries = Object.assign({}, items);
    this.updatedEntries = updatedEntries;
    this.writePromise = (async () => {
      const diffTime = Date.now() - this.lastWriteTime;
      const sleepTime = this.delayMillis - diffTime;
      if (sleepTime > 0) await utils.sleep(sleepTime);
      await this.delegate.write(updatedEntries);
      this.updatedEntries = null;
      this.lastWriteTime = Date.now();
    })();

    return this.writePromise;
  }
}

if ("chrome" in globalThis && chrome.storage) {
  if (chrome.storage.local)
    registerHandler(
      "chrome-local",
      new ChromeStorageAreaHandler(chrome.storage.local),
    );
  if (chrome.storage.sync)
    registerHandler(
      "chrome-sync",
      new BufferedWriteAreaHandler(
        new ChromeStorageAreaHandler(chrome.storage.sync),
        chrome.storage.sync.MAX_WRITE_OPERATIONS_PER_HOUR,
      ),
    );
}
