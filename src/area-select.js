// @flow

import StorageBinder from "./storage-binder";
import * as ah from "./area-handler";

import type { Bindee } from "./storage-binder";

interface AreaSelect extends HTMLSelectElement {
  area: string;
}

interface InternalAreaSelect extends AreaSelect {
}

export function mixinAreaSelect<T: HTMLSelectElement>(c: Class<T>): Class<T & AreaSelect> {
  // $FlowFixMe Force cast to the returned type.
  return class extends c {
    binder: StorageBinder;

    get area(): ah.Area { return getAttr(this, "area"); }
    set area(v: any) { this.setAttribute("area", v); }

    connectedCallback() {
      this.binder = new StorageBinder(generateBindee(this));
      this.binder.onChange = async (event) => {
        writeArea(this);
        dispatchEvent(this, `area-select-${event.type}`, event);
      };
      observeValue(this, async () => {
        await this.binder.submit();
      });

      if (this.length === 0) addAllHandlers(this);
      this.binder.doAutoTask();
      writeArea(this);
    }

    static get observedAttributes() { return ["area"]; }
    attributeChangedCallback(attrName: string) {
      if (!this.binder) return;
      switch (attrName) {
      case "area":
        this.binder.init();
        this.binder.doAutoTask();
        break;
      }
    }

    sync() {
      if (!this.binder) return Promise.resolve();
      return this.binder.sync();
    }
  };
}

const mixedSelect = mixinAreaSelect(HTMLSelectElement);
export default class HTMLAreaSelectElement extends mixedSelect {}

function generateBindee(self: InternalAreaSelect): Bindee {
  return {
    getArea: () => self.area,
    getInterval: () => 700,
    isAutoSync: () => true,
    isAutoLoad: () => false,
    getNames: () => [self.name],
    getElements: () => [self],
    getTarget: () => self,
  };
}

function observeValue(self: InternalAreaSelect, onChange: () => Promise<void>) {
  let value = self.value;
  (async () => {
    while (true) {
      await waitAnimationFrame();
      if (self.value === value) continue;
      value = self.value;
      await onChange();
    }
  })();
}

function waitAnimationFrame() {
  return new Promise((r) => requestAnimationFrame(r));
}

function writeArea(self: InternalAreaSelect) {
  const form = self.form;
  if (form == null) return;
  form.setAttribute("area", self.value);
}

function addAllHandlers(self: InternalAreaSelect) {
  for (const [area] of ah.listHandlers()) {
    const o = document.createElement("option");
    o.innerHTML = area;
    self.appendChild(o);
  }
}

function dispatchEvent(self: HTMLElement, type: string, detail?: any): boolean {
  return self.dispatchEvent(new CustomEvent(type, detail));
}

function getAttr(self: HTMLElement, name: string): string {
  const v = self.getAttribute(name);
  return v ? v : "";
}
