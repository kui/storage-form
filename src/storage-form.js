import * as u from "./utils";
import * as ah from "./area-handler";
import Binder from "./binder";

declare type Name = string;
declare type Value = string;

declare interface FormComponentElement extends HTMLElement {
  name: Name;
  value?: string;
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

      const added = flatten(records.map(r => r.addedNodes));
      if (added.length > 0) {
        for (const e of added) {
          observeComponent(this, e);
        }
      }

      const removed = flatten(records.map((r) => r.removedNodes));
      if (removed.length > 0) {
        remove(this, removed);
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

async function submit(self: HTMLStorageFormElement) {
  if (self.binder) await self.binder.submit(elements(self));
}

async function sync(self: HTMLStorageFormElement, targets?: Array<FormComponentElement>) {
  if (self.binder) {
    await self.binder.sync(targets ? targets : elements(self));
  }
}

async function scan(self: HTMLStorageFormElement) {
  if (self.binder) await self.binder.scan(elements(self));
}

async function remove(self: HTMLStorageFormElement, iter: Iterable<Node>) {
  if (self.binder) await self.binder.remove(iter);
}

function observeComponent(self: HTMLStorageFormElement, newElement: any) {
  const elements = [];
  if (newElement.hasAttribute("name")) elements.push(newElement);
  elements.splice(elements.length, 0, ...newElement.querySelectorAll("*"));

  for (const e of elements) {
    if (e.value == null) continue;
    const o = new MutationObserver(() => {
      if (e.name == null) sync(e);
    });
    o.observe(e, { attributes: true, atributeFilter: ["name"] });
    self.componentObservers.set(e, o);
  }

}

function disconnectComponent(self: HTMLStorageFormElement, element: any) {
  const elements = [];
  elements.push(element);
  for (const e of element.querySelectorAll("*")) elements.push(e);
  for (const e of elements) {
    const o = self.componentObservers.get(e);
    if (o == null) continue;
    self.componentObservers.delete(e);
    o.disconnect();
  }
}

// $FlowFixMe
function elements(self: HTMLStorageFormElement): Array<FormComponentElement> {
  return Array.from(self.elements).filter((e: any) => e.name);
}

async function initBinder(self: HTMLStorageFormElement) {
  self.binder = null;
  const h = getAreaHandler(self);
  self.binder = new Binder(
    h,
    { write: writeForm,
      read: readForm,
    }
  );
  await sync(self);
}

function writeForm(component: FormComponentElement, newValue: ?Value) {
  const type = component.type;
  if (type === "checkbox" || type === "radio") {
    component.checked = newValue === component.value;
    return;
  }

  if (newValue == null || component.value == null)
    return;

  component.value = newValue;
}

function readForm(component: FormComponentElement): ?Value {
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
function setAttr(self: HTMLElement, name: string, value: ?string) {
  if (value == null) return;
  self.setAttribute(name, value);
}

function flatten<T>(iteriter: Iterable<Iterable<T>>): Array<T> {
  return Array.from((function* () {
    for (const iter of iteriter) for (const t of iter) yield t;
  })());
}
