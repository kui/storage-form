/* global chrome */

import * as utils from "./utils";

const handlers = {};

export function registerHandler(area, handler) {
  if (handlers[area]) {
    throw Error(`Already registered handler for "${area}"`);
  }
  handlers[area] = handler;
}

export function findHandler(area) {
  return handlers[area];
}

export function listHandlers() {
  return Object.entries(handlers);
}

//

export class WebStorageAreaHandler {
  constructor(storage) {
    this.storage = storage;
  }

  read(names) {
    const r = names
      .map(n => [n, this.storage.getItem(n)])
      .reduce((o, [n, v]) => {
        if (v != null) o[n] = v;
        return o;
      }, {});
    return Promise.resolve(r);
  }

  write(items) {
    for (const [n, v] of Object.entries(items)) this.storage.setItem(n, v);
    return Promise.resolve();
  }
}

if (typeof localStorage !== "undefined")
  registerHandler("local-storage", new WebStorageAreaHandler(localStorage));
if (typeof sessionStorage !== "undefined")
  registerHandler("session-storage", new WebStorageAreaHandler(sessionStorage));

//

export class ChromeStorageAreaHandler {
  constructor(storage) {
    this.storage = storage;
  }

  read(names) {
    return new Promise(resolve => this.storage.get(names, resolve));
  }

  write(items) {
    return new Promise(resolve => this.storage.set(items, resolve));
  }
}

export class BufferedWriteChromeStorageAreaHandler extends ChromeStorageAreaHandler {
  constructor(storage) {
    super(storage);
    // how interval we should keep for a write operation.
    this.delayMillis =
      (60 * 60 * 1000) / storage.MAX_WRITE_OPERATIONS_PER_HOUR + 300;
    this.updatedEntries = null;
    this.writePromise = Promise.resolve();
    this.lastWriteTime = 0;
  }

  write(items) {
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
      await new Promise(resolve => this.storage.set(updatedEntries, resolve));
      this.updatedEntries = null;
      this.lastWriteTime = Date.now();
    })();

    return this.writePromise;
  }
}

if (typeof chrome !== "undefined" && chrome.storage) {
  if (chrome.storage.local)
    registerHandler(
      "chrome-local",
      new ChromeStorageAreaHandler(chrome.storage.local)
    );
  if (chrome.storage.sync)
    registerHandler(
      "chrome-sync",
      new BufferedWriteChromeStorageAreaHandler(chrome.storage.sync)
    );
}
