/* global chrome */

import StorageForm from "./storage-form";
import * as ah from "./area-handler";

// Register area handlers
if (localStorage)
  ah.registerHandler("local-storage", new ah.WebStorageAreaHandler(localStorage));
if (sessionStorage)
  ah.registerHandler("session-storage", new ah.WebStorageAreaHandler(sessionStorage));
if (chrome && chrome.storage) {
  if (chrome.storage.local)
    ah.registerHandler("chrome-local", new ah.ChromeStorageAreaHandler(chrome.storage.local));
  if (chrome.storage.sync)
    ah.registerHandler("chrome-sync", new ah.ChromeStorageAreaHandler(chrome.storage.sync));
}

// Custom Element v1 seems not to working right on Google Chrome 55
// customElements.define(name, ce, { extends: ex });

// Custom Element v0
// $FlowFixMe Avoid to affect code of `storage-form.js` by Custom Element v0
Object.defineProperty(StorageForm, "extends", { get: () => "form" });
document.registerElement("storage-form", StorageForm);
