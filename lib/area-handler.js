"use strict";

exports.__esModule = true;
exports.registerHandler = registerHandler;
exports.findHandler = findHandler;
exports.listHandlers = listHandlers;

/* global chrome */

var handlers = {};

function registerHandler(area, handler) {
  if (handlers[area]) {
    throw Error(`Already registered handler for "${ area }"`);
  }
  handlers[area] = handler;
}

function findHandler(area) {
  return handlers[area];
}

function listHandlers() {
  return Object.entries(handlers);
}

//

class WebStorageAreaHandler {

  constructor(storage) {
    this.storage = storage;
  }

  read(name) {
    return Promise.resolve(this.storage.getItem(name));
  }

  write(name, newValue) {
    this.storage.setItem(name, newValue);
    return Promise.resolve();
  }

  remove(name) {
    this.storage.removeItem(name);
    return Promise.resolve();
  }
}

exports.WebStorageAreaHandler = WebStorageAreaHandler;
if (typeof localStorage !== "undefined") registerHandler("local-storage", new WebStorageAreaHandler(localStorage));
if (typeof sessionStorage !== "undefined") registerHandler("session-storage", new WebStorageAreaHandler(sessionStorage));

//

class ChromeStorageAreaHandler {

  constructor(storage) {
    this.storage = storage;
  }

  read(name) {
    return new Promise(resolve => this.storage.get(name, v => resolve(v[name])));
  }

  write(name, newValue) {
    return new Promise(resolve => this.storage.set({ [name]: newValue }, resolve));
  }

  remove(name) {
    return new Promise(resolve => this.storage.remove(name, resolve));
  }
}

exports.ChromeStorageAreaHandler = ChromeStorageAreaHandler;
class BatchWriteChromeStorageAreaHandler extends ChromeStorageAreaHandler {

  constructor(storage) {
    super(storage);
    // what interval we should keep for a write operation.
    this.delayMillis = 60 * 60 * 1000 / storage.MAX_WRITE_OPERATIONS_PER_HOUR + 500;
    this.updatedEntries = null;
  }

  write(name, newValue) {
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

exports.BatchWriteChromeStorageAreaHandler = BatchWriteChromeStorageAreaHandler;
if (typeof chrome !== "undefined" && chrome.storage) {
  if (chrome.storage.local) registerHandler("chrome-local", new ChromeStorageAreaHandler(chrome.storage.local));
  if (chrome.storage.sync) registerHandler("chrome-sync", new BatchWriteChromeStorageAreaHandler(chrome.storage.sync));
}