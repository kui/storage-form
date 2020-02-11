import StorageBinder from "./storage-binder";
import * as ah from "./area-handler";

export function mixinAreaSelect(c) {
  return class extends c {

    get area() {
      return getAttr(this, "area");
    }
    set area(v) {
      this.setAttribute("area", v);
    }

    connectedCallback() {
      this.binder = new StorageBinder(generateBindee(this));
      this.binder.onChange = async event => {
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

    static get observedAttributes() {
      return ["area"];
    }
    attributeChangedCallback(attrName) {
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

function generateBindee(self) {
  return {
    getArea: () => self.area,
    getInterval: () => 700,
    isAutoSync: () => true,
    isAutoLoad: () => false,
    getNames: () => [self.name],
    getElements: () => [self],
    getTarget: () => self
  };
}

function observeValue(self, onChange) {
  let value = self.value;
  (async () => {
    for(;;) {
      await waitAnimationFrame();
      if (self.value === value) continue;
      value = self.value;
      await onChange();
    }
  })();
}

function waitAnimationFrame() {
  return new Promise(r => requestAnimationFrame(r));
}

function writeArea(self) {
  const form = self.form;
  if (form == null) return;
  form.setAttribute("area", self.value);
}

function addAllHandlers(self) {
  for (const [area] of ah.listHandlers()) {
    const o = document.createElement("option");
    o.innerHTML = area;
    self.appendChild(o);
  }
}

function dispatchEvent(self, type, detail) {
  return self.dispatchEvent(new CustomEvent(type, detail));
}

function getAttr(self, name) {
  const v = self.getAttribute(name);
  return v ? v : "";
}
