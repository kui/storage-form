import * as utils from "./utils";
import * as ah from "./area-handler";
import Binder from "./binder";

export default class StorageBinder {
  constructor(bindee) {
    this.bindee = bindee;
    this.autoTask = null;
    this.init();

    this.doAutoTask = utils.mergeNextPromise(async () => {
      if (this.bindee.isAutoSync()) {
        await this.sync();
        return;
      }
      if (this.bindee.isAutoLoad()) {
        await this.load();
        return;
      }
    });
  }

  init() {
    this.binder = initBinder(this.bindee);
    this.binder.onChange = async event => {
      const type = { atob: "load", btoa: "submit", sync: "sync" }[event.type];
      const e = {
        type,
        target: this.bindee.getTarget(),
        isForce: event.isForce
      };
      console.debug("onChange: ", e);
      if (this.onChange) {
        await this.onChange(e);
      }
    };
  }

  async load(o) {
    await this.binder.aToB(o);
  }

  async submit(o) {
    await this.binder.bToA(o);
  }

  async sync() {
    await this.binder.sync();
  }

  async startAutoBinding() {
    if (this.autoTask) this.autoTask.cancell();

    if (this.bindee.isAutoLoad() || this.bindee.isAutoSync()) {
      this.autoTask = utils.periodicalTask({
        interval: () => this.bindee.getInterval(),
        task: this.doAutoTask
      });
    } else {
      this.autoTask = null;
    }
  }
}

function initBinder(bindee) {
  return new Binder({
    a: new StorageAreaHandler(bindee),
    b: new FormHandler(bindee),
    diff(oldValue, newValue) {
      return {
        change: { oldValue, newValue },
        isChanged: oldValue !== newValue
      };
    }
  });
}

class StorageAreaHandler {
  constructor(bindee) {
    this.bindee = bindee;
    const h = getAreaHandler(bindee);
    this.handler = h;
  }

  async readAll() {
    if (!this.handler) return new Map();
    const o = await this.handler.read(Array.from(this.bindee.getNames()));
    const a = Object.entries(o).filter(([, v]) => v != null);
    return new Map(a);
  }

  async write(changes) {
    if (!this.handler) return;
    const items = {};
    for (const [key, { newValue }] of changes) {
      items[key] = newValue || "";
    }
    await this.handler.write(items);
  }
}

function getAreaHandler(bindee) {
  const a = bindee.getArea();
  if (!a) {
    console.warn("Require 'area' attribute: ", bindee.getTarget());
    return null;
  }
  const h = ah.findHandler(a);
  if (!h) {
    console.warn("Unsupported 'area':", a, bindee.getTarget());
    return null;
  }
  return h;
}

class FormHandler {
  constructor(bindee) {
    this.bindee = bindee;
  }

  readAll() {
    const items = new Map();
    for (const e of this.bindee.getElements()) {
      const name = e.name;
      if (!name) continue; // filter out empty named elements
      const prevValue = items.get(name);
      if (prevValue) continue; // empty value should update other values such as radio list.
      const value = readValue(e);
      if (value == null) continue;
      items.set(name, value);
    }
    return Promise.resolve(items);
  }

  write(changes) {
    for (const e of this.bindee.getElements()) {
      const name = e.name;
      if (!name) continue; // filter out empty named elements
      const change = changes.get(name);
      if (!change) continue;
      const value = change.newValue || "";
      writeValue(e, value);
    }
    return Promise.resolve();
  }
}

function readValue(e) {
  if (e instanceof HTMLInputElement && ["checkbox", "radio"].includes(e.type)) {
    if (e.checked) return e.value;
    if (e.dataset.uncheckedValue) return e.dataset.uncheckedValue;
    return "";
  } else if (e.value != null) {
    return e.value;
  }
}

function writeValue(e, value) {
  if (e instanceof HTMLInputElement && ["checkbox", "radio"].includes(e.type)) {
    e.checked = e.value === value;
  } else if (e.value != null) {
    e.value = value;
  }
}
