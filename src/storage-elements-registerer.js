/* global chrome */

import StorageForm from "./storage-form";
import * as i from "./storage-items";
import * as ah from "./area-handler";
import WebStorageAreaHandler from "./web-storage-handler";
import ChromeStorageAreaHandler from "./chrome-storage-handler";

// Register area handlers
if (localStorage)
  ah.registerHandler("local-storage", new WebStorageAreaHandler(localStorage));
if (sessionStorage)
  ah.registerHandler("session-storage", new WebStorageAreaHandler(sessionStorage));
if (chrome && chrome.storage) {
  if (chrome.storage.local)
    ah.registerHandler("chrome-local", new ChromeStorageAreaHandler(chrome.storage.local));
  if (chrome.storage.sync)
    ah.registerHandler("chrome-sync", new ChromeStorageAreaHandler(chrome.storage.sync));
}

// Register custom elements
[["storage-form", StorageForm, "form"],
 ["storage-input", i.StorageInputElement, "input"],
 ["storage-textarea", i.StorageTextAreaElement, "textarea"],
 ["storage-select", i.StorageSelectElement, "select"],
].forEach(([name, customElement, extendee]) => {
  // Custom Element v1 seems not to working right on Google Chrome 55
  // customElements.define(name, ce, { extends: ex });

  // Custom Element v0
  // $FlowFixMe Avoid to affect code of `storage-form.js` by Custom Element v0
  Object.defineProperty(customElement, "extends", { get: () => extendee });
  document.registerElement(name, customElement);
});
