// @flow

import * as utils from "./utils";
import StorageBinder from "./storage-binder";
import * as ah from "./area-handler";
import AreaSelect from "./area-select";

import type { BindeeElement } from "./storage-binder";

declare interface FormControlElement extends HTMLElement {
  name: string;
  value?: string;
  type?: string;
  checked?: boolean;
}

export interface StorageForm extends HTMLFormElement {
  autosync: boolean;
  autoload: boolean;
  interval: number;
  area: string;

  load(): Promise<void>;
  sync(): Promise<void>;
}

declare interface InternalStorageForm extends StorageForm {
  binder: StorageBinder;
}

const DEFAULT_INTERVAL = 700;

export function mixinStorageForm<T: HTMLFormElement>(c: Class<T>): Class<T & StorageForm> {
  // $FlowFixMe Force cast to the returned type.
  return class extends c {
    initBinder: () => void;
    binder: StorageBinder;

    get autosync(): boolean { return this.hasAttribute("autosync"); }
    set autosync(b: boolean) { setAttrAsBoolean(this, "autosync", b); }

    get autoload(): boolean { return this.hasAttribute("autoload"); }
    set autoload(b: boolean) { setAttrAsBoolean(this, "autoload", b); }

    get interval(): number {
      const n = parseInt(getAttr(this, "interval"));
      return n > 300 ? n : DEFAULT_INTERVAL;
    }
    set interval(v: any) { this.setAttribute("interval", v); }

    get area(): ah.Area { return getAttr(this, "area"); }
    set area(v: any) { this.setAttribute("area", v); }

    constructor() {
      super();
    }

    createdCallback() {
      this.binder = new StorageBinder(generateBindee(this));
      this.binder.onChange = async (type) => {
        dispatchEvent(this, `storage-form-${type}`, this);
      };

      this.addEventListener("submit", (event) => {
        event.preventDefault();
        this.binder.submit();
      });

      setObserver(this);

      this.binder.startAutoBinding();
    }

    attachedCallback() {
      this.binder.startAutoBinding();
    }

    static get observedAttributes() {
      return [
        "autosync",
        "autoload",
        "area",
      ];
    }

    attributeChangedCallback(attrName: string) {
      switch (attrName) {
      case "autosync":
      case "autoload":
        this.binder.startAutoBinding();
        break;
      case "area":
        this.initBinder();
        this.binder.doAutoTask();
        break;
      }
    }

    initBinder() { this.binder.init(); }
    load() { return this.binder.load(); }
    sync() { return this.binder.sync(); }
  };
}

function generateBindee(self: InternalStorageForm): BindeeElement {
  return {
    getArea: () => self.area,
    getInterval: () => self.interval,
    isAutoSync: () => self.autosync,
    isAutoLoad: () => self.autoload,
    getNames: () => map(getStorageElements(self), e => (e: any).name),
    getElements: () => getStorageElements(self),
  };
}

function* getStorageElements(self: InternalStorageForm): Iterator<HTMLElement> {
  for (const e of self.elements) {
    if (e.area != null) continue; // filter out "area-select"
    if (e.name) continue;
    yield e;
  }
}

function dispatchEvent(self: HTMLElement, type: string, detail?: any): boolean {
  return self.dispatchEvent(new CustomEvent(type, detail));
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

function setObserver(self: InternalStorageForm) {
  const formControlObservers = new Map;

  function observeFormControl(element: FormControlElement): void {
    const o = new MutationObserver(() => self.binder.doAutoTask());
    o.observe(element, { attributes: true, atributeFilter: ["name"] });
    formControlObservers.set(element, o);
  }

  function disconnectFormControl(element: FormControlElement): void {
    const o = formControlObservers.get(element);
    if (o == null) return;
    o.disconnect();
    formControlObservers.delete(element);
  }

  // Observe added/removed form-controls
  // Do NOT use MutationObserver. form controls are not always the DOM children of the form
  // such as <input form="..." ...>.
  // And MutationObserver might be too heaby to observe all descendants of a body element.
  observeFormControls(self, async ({ addedElements, removedElements }) => {
    console.debug("detect added/removed form-controls", self);
    for (const e of addedElements) observeFormControl(e);
    for (const e of removedElements) disconnectFormControl(e);
    await self.binder.doAutoTask();
  });
}

declare type FormControlChanges = {
  addedElements: Set<FormControlElement>,
  removedElements: Set<FormControlElement>,
};
function observeFormControls(self: InternalStorageForm, callback: (r: FormControlChanges) => Promise<void>) {
  let elements = self.elements;
  (async () => {
    while (true) {
      await waitAnimationFrame();
      const newElements = self.elements;
      if (isEqualsArray(elements, newElements)) continue;

      const oldSet = new Set(elements);
      const newSet = new Set(newElements);
      const addedElements = utils.subtractSet(newSet, oldSet);
      const removedElements = utils.subtractSet(oldSet, newSet);
      elements = newElements;
      await callback({ addedElements, removedElements });
    }
  })();
}

function isEqualsArray(a, b) {
  if (a.length !== b.length) return false;
  const len = a.length;
  for (let i = 0; i < len; i++) if (a[i] !== b[i]) return false;
  return true;
}

function getAttr(self: HTMLElement, name: string): string {
  const v = self.getAttribute(name);
  return v ? v : "";
}

function setAttrAsBoolean(self: HTMLElement, name: string, b: boolean) {
  if (b) {
    self.setAttribute(name, "");
  } else {
    self.removeAttribute(name);
  }
}

function waitAnimationFrame() {
  return new Promise((r) => requestAnimationFrame(r));
}

function* map(iter, mapper) {
  for (const e of iter) yield mapper(e);
}
