import * as u from "./utils";
import * as ah from "./area-handler";
import Binder from "./binder";

declare type Value = string;

interface AreaSelect extends HTMLSelectElement {
  area: string;
}

interface InternalAreaSelect extends AreaSelect {
  isInitLoad: boolean;
  binder: ?Binder;
}

const SYNC_INTERVAL = 500;

export function mixinAreaSelect<T: HTMLSelectElement>(c: Class<T>): Class<T & AreaSelect> {
  // $FlowFixMe Force cast to the returned type.
  return class extends c {
    isInitLoad: boolean;
    binder: ?Binder;

    get area(): ah.Area { return getAttr(this, "area"); }
    set area(v: any) { setAttr(this, "area", v); }

    constructor() {
      super();
    }

    createdCallback() {
      this.isInitLoad = true;

      this.addEventListener("change", () => sync(this));
      window.addEventListener("unload", () => sync(this));

      // Periodical sync
      // To observe storage changings and `.value` changings by an external javascripts
      (async () => {
        while (true) {
          await u.sleep(SYNC_INTERVAL);
          await sync(this);
          writeArea(this);
        }
      })();
    }

    attachedCallback() {
      if (this.length === 0) addAllHandlers(this);
      initBinder(this);
      writeArea(this);
    }

    static get observedAttributes() { return ["area"]; }

    attributeChangedCallback(attrName: string) {
      switch (attrName) {
      case "area":
        initBinder(this);
        break;
      }
    }
  };
}

const mixedSelect = mixinAreaSelect(HTMLSelectElement);
export default class HTMLAreaSelectElement extends mixedSelect {
  static get extends() { return "select"; }
}

async function initBinder(self: InternalAreaSelect): Promise<void> {
  // Avoid to initalize until <option> elements are appended
  if (self.options.length === 0) return;

  self.binder = null;

  const h = getAreaHandler(self);
  if (!h) return;

  self.binder = new Binder(h, { write: writeSelect, read: readSelect });

  if (self.isInitLoad) {
    self.isInitLoad = false;
    await sync(self);
  } else {
    await submit(self);
  }
}

function writeSelect(self: any, newValue: ?Value): void {
  if (self.value === newValue) return;
  self.value = newValue;
  writeArea(self);
}

function readSelect(self: any): Value { return self.value; }

async function submit(self: InternalAreaSelect): Promise<void> {
  if (self.binder) await self.binder.submit([self]);
}

async function sync(self: InternalAreaSelect): Promise<void> {
  if (self.binder) await self.binder.sync([self]);
}

function writeArea(self: InternalAreaSelect) {
  const form = self.form;
  if (form == null) return;
  form.setAttribute("area", self.value);
}

function getAreaHandler(self: InternalAreaSelect): ?ah.AreaHandler {
  const a = self.area;
  if (!a) {
    console.debug("Require 'area' attribute", self);
    return null;
  }
  const h = ah.findHandler(a);
  if (!h) {
    console.debug("No such area handler: area=%s, this=%s", self.area, self);
    return null;
  }
  return h;
}

function addAllHandlers(self: InternalAreaSelect) {
  for (const [area] of ah.listHandlers()) {
    const o = document.createElement("option");
    o.innerHTML = area;
    self.appendChild(o);
  }
}

function getAttr(self: HTMLElement, name: string): string {
  const v = self.getAttribute(name);
  return v ? v : "";
}
function setAttr(self: HTMLElement, name: string, value: ?string): void {
  if (value == null) return;
  self.setAttribute(name, value);
}
