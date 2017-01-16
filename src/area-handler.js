// @flow
/* global chrome */

export type Area = string;

export interface AreaHandler {
  read(names: string[]): Promise<{ [name: string]: ?string }>;
  write(items: { [name: string]: string }): Promise<void>;
}

const handlers: { [area: Area]: AreaHandler } = {};

export function registerHandler(area: Area, handler: AreaHandler): void {
  if (handlers[area]) {
    throw Error(`Already registered handler for "${area}"`);
  }
  handlers[area] = handler;
}

export function findHandler(area: Area): ?AreaHandler {
  return handlers[area];
}

export function listHandlers(): Array<[Area, AreaHandler]> {
  return Object.entries(handlers);
}

//

export class WebStorageAreaHandler {
  storage: Storage;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  read(names: string[]): Promise<{ [name: string]: ?string }> {
    const r = names
          .map((n) => [n, this.storage.getItem(n)])
          .reduce((o, [n, v]) => { o[n] = v; return o; }, {});
    return Promise.resolve(r);
  }

  write(items: { [name: string]: string }): Promise<void> {
    for (const [n, v] of Object.entries(items))
      this.storage.setItem(n, v);
    return Promise.resolve();
  }
}

if (typeof localStorage !== "undefined")
  registerHandler("local-storage", new WebStorageAreaHandler(localStorage));
if (typeof sessionStorage !== "undefined")
  registerHandler("session-storage", new WebStorageAreaHandler(sessionStorage));

//

export class ChromeStorageAreaHandler {
  storage: ChromeStorageArea;

  constructor(storage: ChromeStorageArea) {
    this.storage = storage;
  }

  read(names: string[]): Promise<{ [name: string]: ?string }> {
    return new Promise((resolve) => this.storage.get(names, resolve));
  }

  write(items: { [name: string]: string }): Promise<void> {
    return new Promise((resolve) => this.storage.set(items, resolve));
  }
}

export class BufferedWriteChromeStorageAreaHandler extends ChromeStorageAreaHandler {
  delayMillis: number;
  updatedEntries: ?{ [k: string]: string };
  writePromise: Promise<void>;

  constructor(storage: ChromeStorageArea & { MAX_WRITE_OPERATIONS_PER_HOUR: number }) {
    super(storage);
    // what interval we should keep for a write operation.
    this.delayMillis = (60 * 60 * 1000 / storage.MAX_WRITE_OPERATIONS_PER_HOUR) + 500;
    this.updatedEntries = null;
    this.writePromise = Promise.reject(Error("Illegal state"));
  }

  write(items: { [name: string]: string }): Promise<void> {
    if (this.updatedEntries != null) {
      Object.assign(this.updatedEntries, items);
      return this.writePromise;
    }

    this.updatedEntries = Object.assign({}, items);
    this.writePromise = new Promise((resolve) => {
      setTimeout(() => {
        if (this.updatedEntries == null) return;
        this.storage.set(this.updatedEntries, resolve);
        this.updatedEntries = null;
      }, this.delayMillis);
    });

    return this.writePromise;
  }
}

if (typeof chrome !== "undefined" && chrome.storage) {
  if (chrome.storage.local)
    registerHandler("chrome-local", new ChromeStorageAreaHandler(chrome.storage.local));
  if (chrome.storage.sync)
    registerHandler("chrome-sync", new BufferedWriteChromeStorageAreaHandler(chrome.storage.sync));
}
