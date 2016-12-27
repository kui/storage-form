import * as u from "./utils";
import * as ah from "./area-handler";

declare interface FormComponentElement extends HTMLElement {
  name?: string;
  value?: string;
  checked?: boolean;
  selected?: boolean;
  options?: HTMLOptionsCollection;
}

declare class Object {
  static entries<K, V>(o: { [key: K]: V }): Array<[K, V]>
}

declare type Values = { [key: string]: Array<string> };
declare type ValueChanges = { [key: string]: Array<[string, string]> };

export default class HTMLStorageFormElement extends HTMLFormElement {
  values: Values;

  constructor() {
    super();
    this.values = {};
  }

  createdCallback() {
    this.addEventListener("submit", (event) => {
      event.preventDefault();
      this.store();
    });
    // if (this.isAutoSyncEnabled())this.periodicalSync();
  }

  writeFormByName(name: string, values: Array<string>) {
    if (values.length === 0) return;

    const element = this[name];
    // checkbox
    if (element.checked !== undefined) {
      element.checked = true;
      return;
    }

    // other text forms
    element.value = values[0];
  }

  async load() {
    const storageChanges = this.getStorageChanges();

    const formValues = this.readFormAll();

    for (const [name, values] of Object.entries(storeValues)) {
      this.writeFormByName(name, values);
    }
  }

  async getStorageChanges(): Promise<ValueChanges> {
    const storeValues = await this.readStorageAll();
    return this.diffValues(storeValues, this.values);
  }

  diffValues(newValues: Values, oldValues: Values): ValueChanges {
    const names: Array<string> = u.dedup(Object.keys(newValues).concat(Object.keys(oldValues)));
    return names.reduce((result: ValueChanges, name: string): ValueChanges => {
      const newValue = newValues[name][0];
      const oldValue = oldValues[name][0];
      if (newValue === oldValue) return result;
      result[name] = [[newValue, oldValue]];
      return result;
    }, {});
  }

  async readStorageAll(): Promise<Values> {
    // start all data fatching at first
    const ps = this.getNames().reduce((values, name): { [key: string]: Promise<Array<string>> } => {
      values[name] = this.readStorageByName(name);
      return values;
    }, {});

    // resolve promises
    const result = {};
    for (const [name, promise] of Object.entries(ps)) {
      result[name] = await promise;
    }

    return result;
  }

  async readStorageByName(name: string): Promise<Array<string>> {
    const v = await this.getAreaHandler().read(name);
    return v == null ? [] : [v];
  }

  async store() {
    this.values = this.readFormAll();
    await Promise.all(
      Object.entries(this.values)
        .map(([k, v]) => this.writeStorageByName(k, v))
    );
  }

  readFormAll(): { [key: string ]: Array<string> } {
    return Array.from(this.elements)
      .reduce((items: { [key: string ]: Array<string> }, element: FormComponentElement) => {
        if (!element.name) return items;
        if (element.value === undefined) return items;

        const n = element.name;
        if (items[n] == null) items[n] = [];

        // Do nothing when the element has "checked" or "selected" but it's value is "false"
        if (element.checked === false || element.selected === false) return items;

        // expand <select> elements to <option> elements.
        if (element.options !== undefined) {
          // $FlowFixMe `Array.from` does not accept HTMLOptionsCollection as an argument.
          const opts: Array<HTMLOptionElement> = Array.from(element.options);
          const vals = opts.map((e) => e.value);
          items[n] = items[n].concat(...vals);
          return items;
        }

        items[n].unshift(element.value);
        return items;
      }, {});
  }

  getNames(): Array<string> {
    return Array.from(this.elements)
      .reduce((names, e: FormComponentElement) => {
        if (!e.name) return names;
        return names.concat(e.name);
      }, []);
  }

  async writeStorageByName(name: string, values: Array<string>) {
    const h = this.getAreaHandler();
    const p = h.write(name, values.join(","));
    const ps = values.map((v, i) => h.write(`${name}[${i}]`, v));
    await Promise.all(ps.concat(p));
  }

  getAreaHandler(): ah.AreaHandler {
    const a: ?ah.Area = this.getArea();
    if (!a) throw Error("\"area\" attribute is required");

    const h = ah.findHandler(a);
    if (!h) throw Error(`Unsupported area: ${a}`);
    return h;
  }

  getArea(): ?ah.Area {
    const a = this.getAttribute("area");
    if (a) return a;
    return null;
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
