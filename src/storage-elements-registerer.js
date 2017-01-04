import StorageFormElement from "./storage-form";

// Custom Element v1 seems not to works right to extend <form> in Google Chrome 55
// customElements.define("storage-form", StorageFormElement, { extends: "form" });
// window.StorageFormElement = StorageFormElement;

// Custom Element v0
// $FlowFixMe Force define to avoid to affect code of `storage-form.js` by Custom Element v0
Object.defineProperty(StorageFormElement, "extends", { get: () => "form" });
document.registerElement("storage-form", StorageFormElement);
