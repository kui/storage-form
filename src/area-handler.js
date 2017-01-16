// @flow
/* global chrome */

export type Area = string;

export interface AreaHandler {
  read(name: string): Promise<?string>;
  write(name: string, newValue: string): Promise<void>;
  remove(name: string): Promise<void>;
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

  read(name: string): Promise<?string> {
    return Promise.resolve(this.storage.getItem(name));
  }

  write(name: string, newValue: string): Promise<void> {
    this.storage.setItem(name, newValue);
    return Promise.resolve();
  }

  remove(name: string): Promise<void> {
    this.storage.removeItem(name);
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

  read(name: string): Promise<?string> {
    return new Promise((resolve) => this.storage.get(name, (v) => resolve(v[name])));
  }

  write(name: string, newValue: string): Promise<void> {
    return new Promise((resolve) => this.storage.set({ [name]: newValue }, resolve));
  }

  remove(name: string): Promise<void> {
    return new Promise((resolve) => this.storage.remove(name, resolve));
  }
}

export class BatchWriteChromeStorageAreaHandler extends ChromeStorageAreaHandler {
  delayMillis: number;
  updatedEntries: ?{ [k: string]: string };

  constructor(storage: ChromeStorageArea & { MAX_WRITE_OPERATIONS_PER_HOUR: number }) {
    super(storage);
    // what interval we should keep for a write operation.
    this.delayMillis = (60 * 60 * 1000 / storage.MAX_WRITE_OPERATIONS_PER_HOUR) + 500;
    this.updatedEntries = null;
  }

  write(name: string, newValue: string): Promise<void> {
    if (this.updatedEntries != null) {
      this.updatedEntries[name] = newValue;
      return Promise.resolve();
    }

    this.updatedEntries = { [name]: newValue };
    setTimeout(() => {
      if (this.updatedEntries == null) return;
      this.storage.set(this.updatedEntries);
      this.updatedEntries = null;
    }, this.delayMillis);

    return Promise.resolve();
  }
}

if (typeof chrome !== "undefined" && chrome.storage) {
  if (chrome.storage.local)
    registerHandler("chrome-local", new ChromeStorageAreaHandler(chrome.storage.local));
  if (chrome.storage.sync)
    registerHandler("chrome-sync", new BatchWriteChromeStorageAreaHandler(chrome.storage.sync));
}
