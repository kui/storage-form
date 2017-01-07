import * as u from "./utils";

import Binder from "./binder";
import type { Element } from "./binder";

import * as ah from "./area-handler";
import AreaSelect from "./area-select";

declare type Name = string;
declare type Value = string;

declare interface FormComponentElement extends HTMLElement {
  name: Name;
  value?: Value;
  type?: string;
  checked?: boolean;
}

export interface StorageForm extends HTMLFormElement {
  autosync: number;
  area: string;
}

declare interface InternalStorageForm extends StorageForm {
  isInitLoad: boolean;
  binder: ?Binder;
  componentObservers: Map<FormComponentElement, MutationObserver>;
}

const DEFAULT_SYNC_INTERVAL = 700;

export function mixinStorageForm<T: HTMLFormElement>(c: Class<T>): Class<T & StorageForm> {
  // $FlowFixMe Force cast to the returned type.
  return class extends c {
    isInitLoad: boolean;
    binder: ?Binder;
    componentObservers: Map<FormComponentElement, MutationObserver>;

    get autosync(): number {
      const n = parseInt(getAttr(this, "autosync"));
      return n > 0 ? n : DEFAULT_SYNC_INTERVAL;
    }
    set autosync(v: any) { setAttr(this, "autosync", v); }
    get area(): ah.Area { return getAttr(this, "area"); }
    set area(v: any) { setAttr(this, "area", v); }

    constructor() {
      super();
    }

    createdCallback() {
      this.isInitLoad = true;
      this.componentObservers = new Map();

      initBinder(this);

      this.addEventListener("submit", (event) => {
        event.preventDefault();
        submit(this);
      });

      window.addEventListener("unload", () => {
        if (isAutoSyncEnabled(this)) {
          sync(this);
        }
      });

      new MutationObserver((records) => {
        console.debug("scan by form MutationObserver: ", this);
        scan(this);

        const added: Array<HTMLElement> =
              flatten(records.map(r => (r.addedNodes: Iterable<any>)))
              .filter((e) => e instanceof HTMLElement);
        if (added.length > 0) {
          for (const e of added) {
            observeComponent(this, e);
          }
        }

        const removed: Array<HTMLElement> =
              flatten(records.map((r) => (r.removedNodes: Iterable<any>)))
              .filter((e) => e instanceof HTMLElement);
        if (removed.length > 0) {
          // Use any to force cast to Array<FormComponentElements>
          remove(this, (removed.filter((e) => (e: any).name): Array<any>));
          for (const e of removed) {
            disconnectComponent(this, e);
          }
        }
      }).observe(this, { childList: true, subtree: true });

      scan(this);

      // Periodical scan/sync
      // To observe:
      //   * storage value changings
      //   * external form components (such as a <input form="..." ...>)
      //   * form value changings by an external javascript
      (async () => {
        while (true) {
          await u.sleep(this.autosync);
          if (isAutoSyncEnabled(this)) {
            await sync(this);
          } else {
            await scan(this);
          }
        }
      })();
    }

    attachedCallback() {
      scan(this);
    }

    static get observedAttributes() {
      return [
        "autosync",
        "area",
      ];
    }

    attributeChangedCallback(attrName: string) {
      switch (attrName) {
      case "autosync":
        break;
      case "area":
        initBinder(this);
        break;
      }
    }
  };
}

const mixedForm = mixinStorageForm(HTMLFormElement);
export default class HTMLStorageFormElement extends mixedForm {
  static get extends() { return "form"; }

  static register() {
    // Custom Element v1 seems not to works right to extend <form> in Google Chrome 55
    // See http://stackoverflow.com/a/41458692/3864351
    // Polyfill too: https://github.com/webcomponents/custom-elements/tree/master/src
    // > To do: Implement built-in element extension (is=)
    // customElements.define("storage-form", StorageFormElement, { extends: "form" });
    // window.StorageFormElement = StorageFormElement;

    // Custom Element v0
    document.registerElement("storage-form", HTMLStorageFormElement);
    document.registerElement("area-select", AreaSelect);
  }
}

function isAutoSyncEnabled(self: HTMLFormElement): boolean {
  return self.hasAttribute("autosync");
}

async function submit(self: InternalStorageForm): Promise<void> {
  if (self.binder) await self.binder.submit(elements(self));
}

async function sync(self: InternalStorageForm, targets?: Array<Element>): Promise<void> {
  if (self.binder) await self.binder.sync(targets ? targets : elements(self));
}

async function scan(self: InternalStorageForm): Promise<void> {
  if (self.binder) await self.binder.scan(elements(self));
}

async function remove(self: InternalStorageForm, elems: Array<Element>): Promise<void> {
  if (self.binder) await self.binder.remove(elems);
}

function observeComponent(self: InternalStorageForm, newElement: HTMLElement): void {
  const elements: Array<FormComponentElement> =
        // force cast
        ([newElement, ...Array.from(newElement.querySelectorAll("*"))]
         .filter((e) => (e: any).value != null && (e: any).name != null): any);

  for (const e of elements) {
    const o = new MutationObserver(() => sync(self, [e]));
    o.observe(e, { attributes: true, atributeFilter: ["name"] });
    self.componentObservers.set(e, o);
  }
}

function disconnectComponent(self: InternalStorageForm, element: HTMLElement): void {
  const elements = [element, ...Array.from(element.querySelectorAll("*"))];
  for (const e of elements) {
    const o = self.componentObservers.get((e: any));
    if (o == null) continue;
    self.componentObservers.delete((e: any));
    o.disconnect();
  }
}

function elements(self: InternalStorageForm): Array<Element> {
  return Array.from(((self.elements): Iterable<any>))
    .filter(e => e.name)
    .filter(e => !(e instanceof AreaSelect));
}

async function initBinder(self: InternalStorageForm): Promise<void> {
  self.binder = null;

  const h = getAreaHandler(self);
  if (!h) return;

  self.binder = new Binder(h, { write: writeForm, read: readForm });
  if (self.isInitLoad) {
    self.isInitLoad = false;
    await sync(self);
  } else {
    await submit(self);
  }
}

function writeForm(component: any, newValue: ?Value): void {
  const type = component.type;
  if (type === "checkbox" || type === "radio") {
    component.checked = newValue === component.value;
    return;
  }

  if (newValue == null || component.value == null)
    return;

  component.value = newValue;
}

function readForm(component: any): ?Value {
  const type = component.type;
  if (type === "checkbox" || type === "radio") {
    return component.checked ? component.value : null;
  }
  return component.value;
}

function getAreaHandler(self: InternalStorageForm): ?ah.AreaHandler {
  const a = self.area;
  if (!a) {
    console.debug("Require 'area' attribute", self);
    return null;
  }
  const h = ah.findHandler(a);
  if (!h) {
    console.debug("No such area handler: area=%s, this=%o", self.area, self);
    return null;
  }
  return h;
}

function getAttr(self: HTMLElement, name: string): string {
  const v = self.getAttribute(name);
  return v ? v : "";
}
function setAttr(self: HTMLElement, name: string, value: ?string): void {
  if (value == null) return;
  self.setAttribute(name, value);
}

function flatten<T>(iteriter: Iterable<Iterable<T>>): Array<T> {
  return Array.from((function* () {
    for (const iter of iteriter) for (const t of iter) yield t;
  })());
}
