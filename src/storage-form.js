import * as u from "./utils";

declare interface StorableElement extends HTMLElement {
  name?: string;
  checked?: boolean;
  store(): any;
}

export default class HTMLStorageFormElement extends HTMLFormElement {
  constructor() {
    super();
  }

  createdCallback() {
    this.addEventListener("submit", (event) => {
      event.preventDefault();
      this.store();
    });
    if (this.isAutoSyncEnabled())
      this.periodicalSync();
  }

  async store(): Promise<void> {
    // Avoid to store twice by "name"
    const storingItems: Map<string, StorableElement> = Array
          .from(this.elements)
          .reduce((map, element: StorableElement) => {
            if (!(element.store instanceof Function)) return map;
            const name = element.name;
            if (!name) return map;
            if (!map.has(name)) {
              map.set(name, element);
              return map;
            }
            // Overrite a storing element if "checked" element was found.
            if (element.checked) {
              map.set(name, element);
              return map;
            }
            return map;
          }, new Map());

    await Promise.all(Array.from(storingItems.values()).map((e) => e.store()));
  }

  async sync(): Promise<void> {
    const d = this.getSyncDelay();
    if (d == null) return Promise.reject(Error("Require positive integer value 'sync-delay' attribute"));
    if (d <= 0) return Promise.reject(Error(`Require positive number for "sync-delay": ${d}`));

    await u.sleep(d);

    if (!this.isAutoSyncEnabled()) {
      return;
    }

    return this.store();
  }

  isAutoSyncEnabled(): boolean {
    return this.hasAttribute("sync") && this.getSyncDelay() !== null;
  }

  getSyncDelay() {
    const a = this.getAttribute("sync-delay");
    if (!a) return null;
    const d = parseInt(a);
    if (d <= 0) return null;
    return d;
  }

  async periodicalSync() {
    while (this.isAutoSyncEnabled()) {
      await this.sync();
    }
  }

  attachedCallback() {}

  detachedCallback() {}

  static get observedAttributes() {
    return [
      "sync",
      "sync-delay",
      // "area",
    ];
  }

  attributeChangedCallback(attrName: string) {
    if (attrName === "sync" ||
        attrName === "sync-delay") {
      this.periodicalSync();
    }
  }
}
