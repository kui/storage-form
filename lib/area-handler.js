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
if (localStorage) registerHandler("local-storage", new WebStorageAreaHandler(localStorage));
if (sessionStorage) registerHandler("session-storage", new WebStorageAreaHandler(sessionStorage));

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
if (chrome && chrome.storage) {
  if (chrome.storage.local) registerHandler("chrome-local", new ChromeStorageAreaHandler(chrome.storage.local));
  if (chrome.storage.sync) registerHandler("chrome-sync", new ChromeStorageAreaHandler(chrome.storage.sync));
}