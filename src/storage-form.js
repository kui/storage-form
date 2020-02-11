import * as utils from "./utils";
import StorageBinder from "./storage-binder";
import AreaSelect from "./area-select";
import LoadButton from "./load-button";

const DEFAULT_INTERVAL = 700;

export function mixinStorageForm(c) {
  return class extends c {

    get autosync() {
      return this.hasAttribute("autosync");
    }
    set autosync(b) {
      setAttrAsBoolean(this, "autosync", b);
    }

    get autoload() {
      return this.hasAttribute("autoload");
    }
    set autoload(b) {
      setAttrAsBoolean(this, "autoload", b);
    }

    get interval() {
      const n = parseInt(getAttr(this, "interval"));
      return n > 300 ? n : DEFAULT_INTERVAL;
    }
    set interval(v) {
      this.setAttribute("interval", v);
    }

    get area() {
      return getAttr(this, "area");
    }
    set area(v) {
      this.setAttribute("area", v);
    }

    connectedCallback() {
      this.binder = new StorageBinder(generateBindee(this));
      this.binder.onChange = async event => {
        dispatchEvent(this, `storage-form-${event.type}`, event);
      };

      this.binder.startAutoBinding();

      this.addEventListener("submit", event => {
        event.preventDefault();
        this.binder.submit({ force: true });
      });

      setObserver(this);

      this.binder.startAutoBinding();
    }

    static get observedAttributes() {
      return ["autosync", "autoload", "area"];
    }

    attributeChangedCallback(attrName) {
      if (!this.binder) return;
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

    initBinder() {
      this.binder.init();
    }
    load() {
      return this.binder.load({ force: true });
    }
    sync() {
      return this.binder.sync();
    }
  };
}

function generateBindee(self) {
  return {
    getArea: () => self.area,
    getInterval: () => self.interval,
    isAutoSync: () => self.autosync,
    isAutoLoad: () => self.autoload,
    getNames: () => map(getStorageElements(self), e => e.name),
    getElements: () => getStorageElements(self),
    getTarget: () => self
  };
}

function* getStorageElements(self) {
  for (const e of self.elements) {
    if (e.area != null) continue; // filter out "area-select"
    if (!e.name) continue;
    yield e;
  }
}

function dispatchEvent(self, type, detail) {
  return self.dispatchEvent(new CustomEvent(type, detail));
}

const mixedForm = mixinStorageForm(HTMLFormElement);
export default class HTMLStorageFormElement extends mixedForm {
  static register() {
    customElements.define("storage-form", HTMLStorageFormElement, { extends: "form" });
    customElements.define("area-select", AreaSelect, { extends: "select" });
    customElements.define("load-button", LoadButton, { extends: "button" });
  }
}

function setObserver(self) {
  const formControlObservers = new Map();

  function observeFormControl(element) {
    const o = new MutationObserver(() => self.binder.doAutoTask());
    o.observe(element, { attributes: true, atributeFilter: ["name"] });
    formControlObservers.set(element, o);
  }

  function disconnectFormControl(element) {
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

function observeFormControls(self, callback) {
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

function getAttr(self, name) {
  const v = self.getAttribute(name);
  return v ? v : "";
}

function setAttrAsBoolean(self, name, b) {
  if (b) {
    self.setAttribute(name, "");
  } else {
    self.removeAttribute(name);
  }
}

function waitAnimationFrame() {
  return new Promise(r => requestAnimationFrame(r));
}

function* map(iter, mapper) {
  for (const e of iter) yield mapper(e);
}
