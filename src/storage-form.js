import * as u from "./utils";
import * as ah from "./area-handler";

declare interface FormComponentElement extends HTMLElement {
  name?: string;
  value?: string;
  type?: string;
  checked?: boolean;

  // <select> element
  options?: HTMLOptionsCollection;
  length?: number;

  // <option> element
  selected?: boolean;
}

declare class Object {
  static entries<K, V>(o: { [key: K]: V }): Array<[K, V]>
}

// See https://www.w3.org/TR/html5/infrastructure.html#htmloptionscollection
declare interface HTMLOptionsCollection extends HTMLCollection<HTMLOptionElement> {
}

type Name = string

// TODO use Map<string, Array<string>>
declare type Values = { [key: Name]: Array<string> };
// TODO use Map<string, Array<?{ newValue: ?string, oldValue: ?string }>>
declare type ValueChanges = { [key: Name]: Array<?[?string, ?string]> };

declare type FormElements = u.MMap<Name, FormComponentElement>;

export default class HTMLStorageFormElement extends HTMLFormElement {
  values: Values;
  storageSyncTask: ?number;
  formElements: FormElements;

  constructor() {
    super();
  }

  createdCallback() {
    this.values = {};
    this.formElements = new u.MMap();
    this.addEventListener("submit", (event) => {
      event.preventDefault();
      this.store();
    });
    // if (this.isAutoSyncEnabled())this.periodicalSync();
  }

  async attachedCallback() {
    await this.scanFormComponents();

    if (this.storageSyncTask == null) {
      this.storageSyncTask = setInterval(() => {
        // this.scanFormComponents();
        // this.load();
        // this.store();
      }, 500);
    }
  }

  detachedCallback() {
    if (this.storageSyncTask != null)
      clearTimeout(this.storageSyncTask);
  }

  async scanFormComponents() {
    const currentElements = new Set(this.elements);
    const added = u.subtractSet(currentElements, this.getFormElementSet());
    this.formElements = Array.from(currentElements).reduce((map: FormElements, e) => {
      const name = e.name;
      if (!name) return map;

      let el = map.get(name);
      if (!el) {
        el = [];
        map.set(name, el);
      }
      el.unshift(e);
      return map;
    }, new u.MMap());

    added.forEach(this.initComponent, this);

    if (added.size === 0) return;

    const addedNames: Array<string> = Array.from(added)
    // $FlowFixMe null/undfined check by filter
          .map(e => e.name)
          .filter(n => n);
    await this.load();
    await this.store(addedNames);
  }

  getFormElementSet(): Set<FormComponentElement> {
    return Array.from(this.formElements.values())
      .reduce((set, elements) => {
        elements.forEach(set.add, set);
        return set;
      }, new Set());
  }

  initComponent(e: FormComponentElement) {
    console.debug("initComponent: %o", e);
    // set some of event listener
  }

  async load() {
    console.debug("load");
    const storageValues = await this.readStorageAll();
    const storageChanges =  this.diffValues(storageValues, this.values);
    this.values = storageValues;
    this.writeForm(storageChanges);
  }

  async store(names?: Array<string> = []) {
    console.debug("store: %o", names.length === 0 ? "all" : names);
    const formValues = this.readFormAll();
    console.debug("form values: %o", formValues);

    const formChanges = this.diffValues(formValues, this.values);
    console.debug("form changes: %o", formChanges);

    this.values = formValues;

    // Store all
    if (names.length === 0) {
      await this.writeStorage(formChanges);
      return;
    }

    // Store values specified with "names"
    const subChanges = names.reduce((result, name) => {
      result[name] = formChanges[name];
      return result;
    }, {});

    await this.writeStorage(subChanges);
  }

  diffValues(newValues: Values, oldValues: Values): ValueChanges {
    const names: Array<string> = u.dedup(Object.keys(newValues).concat(Object.keys(oldValues)));
    return names.reduce((result: ValueChanges, name: string): ValueChanges => {
      if (newValues[name] == null) newValues[name] = [];
      if (oldValues[name] == null) oldValues[name] = [];
      result[name] = [];
      const len = Math.max(newValues[name].length, oldValues[name].length);
      for (let i = 0; i < len; i++) {
        const newValue = newValues[name][i];
        const oldValue = oldValues[name][i];
        result[name][i] = newValue === oldValue ? null : [newValue, oldValue];
      }
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

  writeForm(changes: ValueChanges) {
    for (const [name, changeArray] of Object.entries(changes)) {
      const change = changeArray[0];
      const [newValue] = change == null ? [] : change;
      const elements = this.formElements.get(name);

      if (elements == null) continue;

      console.debug("write to form: name=%s, value=%s, elements=%o", name, newValue, elements);

      elements.forEach((e) => {
        if (e.type === "checkbox" || e.type === "radio") {
          e.checked = newValue === e.value;
          return;
        }

        if (e.value != null) {
          if (newValue == null) return;
          e.value = newValue;
          return;
        }

        console.error("Unsupported element: %o", e);
      });
    }
  }

  async writeStorage(changes: ValueChanges) {
    const handler = this.getAreaHandler();
    const promises = Object.entries(changes).map(async ([name, chageArray]) => {
      const c = chageArray[0];
      if (c == null) return;
      const [newValue] = c;

      console.debug("write to storage: name=%s, value=%s", name, newValue);

      if (newValue == null) {
        await handler.removeItem(name);
      } else {
        await handler.write(name, newValue);
      }
    });
    await Promise.all(promises);
  }

  readFormAll(): Values {
    return Array.from(this.formElements.flattenValues())
      .reduce((items: Values, element: FormComponentElement) => {
        if (!element.name) return items;
        if (element.value == null) return items;

        const n = element.name;
        if (items[n] == null) items[n] = [];

        if (element.type === "checkbox" || element.type === "radio") {
          if (element.checked) items[n].unshift(element.value);
          return items;
        }

        // expand <select> elements to <option> elements.
        if (element.options != null) {
          const vals = items[n];
          for (const opt of element.options) {
            if (!opt.selected) continue;
            vals.unshift(opt.value);
          }
          return items;
        }

        items[n].unshift(element.value);
        return items;
      }, {});
  }

  getNames(): Array<string> {
    return Array.from(this.formElements.flattenValues())
      .reduce((names, e: FormComponentElement) => {
        if (!e.name) return names;
        names.unshift(e.name);
        return names;
      }, []);
  }

  getAreaHandler(): ah.AreaHandler {
    const a: ?ah.Area = this.getArea();
    if (!a) throw Error("\"area\" attribute is required");

    const h = ah.findHandler(a);
    if (!h) throw Error(`Unsupported area: "${a}"`);
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
