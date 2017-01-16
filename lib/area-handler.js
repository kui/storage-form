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

  read(names) {
    var r = names.map(n => [n, this.storage.getItem(n)]).reduce((o, _ref) => {
      var n = _ref[0],
          v = _ref[1];
      o[n] = v;return o;
    }, {});
    return Promise.resolve(r);
  }

  write(items) {
    for (var _iterator = Object.entries(items), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref3;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref3 = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref3 = _i.value;
      }

      var _ref2 = _ref3;
      var n = _ref2[0];
      var v = _ref2[1];

      this.storage.setItem(n, v);
    }return Promise.resolve();
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

  read(names) {
    return new Promise(resolve => this.storage.get(names, resolve));
  }

  write(items) {
    return new Promise(resolve => this.storage.set(items, resolve));
  }
}

exports.ChromeStorageAreaHandler = ChromeStorageAreaHandler;
class BufferedWriteChromeStorageAreaHandler extends ChromeStorageAreaHandler {

  constructor(storage) {
    super(storage);
    // what interval we should keep for a write operation.
    this.delayMillis = 60 * 60 * 1000 / storage.MAX_WRITE_OPERATIONS_PER_HOUR + 500;
    this.updatedEntries = null;
    this.writePromise = Promise.reject(Error("Illegal state"));
  }

  write(items) {
    if (this.updatedEntries != null) {
      Object.assign(this.updatedEntries, items);
      return this.writePromise;
    }

    this.updatedEntries = Object.assign({}, items);
    this.writePromise = new Promise(resolve => {
      setTimeout(() => {
        if (this.updatedEntries == null) return;
        this.storage.set(this.updatedEntries, resolve);
        this.updatedEntries = null;
      }, this.delayMillis);
    });

    return this.writePromise;
  }
}

exports.BufferedWriteChromeStorageAreaHandler = BufferedWriteChromeStorageAreaHandler;
if (typeof chrome !== "undefined" && chrome.storage) {
  if (chrome.storage.local) registerHandler("chrome-local", new ChromeStorageAreaHandler(chrome.storage.local));
  if (chrome.storage.sync) registerHandler("chrome-sync", new BufferedWriteChromeStorageAreaHandler(chrome.storage.sync));
}