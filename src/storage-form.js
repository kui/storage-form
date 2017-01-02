import * as u from "./utils";
import * as ah from "./area-handler";
import Binder from "./binder";
import type { Element } from "./binder";

declare type Name = string;
declare type Value = string;

declare interface FormComponentElement extends HTMLElement {
  name: Name;
  value?: Value;
  type?: string;
  checked?: boolean;
}

const DEFAULT_SYNC_INTERVAL = 700;

export default class HTMLStorageFormElement extends HTMLFormElement {
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
    initBinder(this);
    this.componentObservers = new Map();

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
        // force cast to Array<FormComponentElements>
        remove(this, (removed.filter((e) => (e: any).name): Array<any>));
        for (const e of removed) {
          disconnectComponent(this, e);
        }
      }
    }).observe(this, { childList: true, subtree: true });

    scan(this);

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
}

function isAutoSyncEnabled(self: HTMLStorageFormElement): boolean {
  return self.hasAttribute("autosync");
}

async function submit(self: HTMLStorageFormElement): Promise<void> {
  if (self.binder) await self.binder.submit(elements(self));
}

async function sync(self: HTMLStorageFormElement, targets?: Array<Element>): Promise<void> {
  if (self.binder) await self.binder.sync(targets ? targets : elements(self));
}

async function scan(self: HTMLStorageFormElement): Promise<void> {
  if (self.binder) await self.binder.scan(elements(self));
}

async function remove(self: HTMLStorageFormElement, elems: Array<Element>): Promise<void> {
  if (self.binder) await self.binder.remove(elems);
}

function observeComponent(self: HTMLStorageFormElement, newElement: HTMLElement): void {
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

function disconnectComponent(self: HTMLStorageFormElement, element: HTMLElement): void {
  const elements = [element, ...Array.from(element.querySelectorAll("*"))];
  for (const e of elements) {
    const o = self.componentObservers.get((e: any));
    if (o == null) continue;
    self.componentObservers.delete((e: any));
    o.disconnect();
  }
}

function elements(self: HTMLStorageFormElement): Array<Element> {
  return Array.from(((self.elements): Iterable<any>)).filter(e => e.name);
}

async function initBinder(self: HTMLStorageFormElement): Promise<void> {
  self.binder = null;

  const h = getAreaHandler(self);
  if (!h) return;

  self.binder = new Binder(
    h,
    { write: writeForm,
      read: readForm }
  );
  await sync(self);
}

function writeForm(component: any, newValue: ?Value): void {
  (component: FormComponentElement);
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
  (component: FormComponentElement);
  const type = component.type;
  if (type === "checkbox" || type === "radio") {
    return component.checked ? component.value : null;
  }
  return component.value;
}

function getAreaHandler(self: HTMLStorageFormElement): ?ah.AreaHandler {
  const a = self.area;
  if (!a) {
    console.error("Require 'area' attribute");
    return null;
  }
  const h = ah.findHandler(a);
  if (!h) {
    console.error("No such area handler: area=%s", self.area);
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
