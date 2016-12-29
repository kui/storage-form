import * as u from "./utils";
import * as ah from "./area-handler";

declare interface NamableHTMLElement extends HTMLElement {
  name?: string;
}
declare interface FormComponentElement extends HTMLElement {
  name: string;

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
declare class HTMLOptionsCollection extends HTMLCollection<HTMLOptionElement> {
}

type Name = string

// TODO use Map<string, Array<string>>
declare type Values = { [key: Name]: Array<string> };
// TODO use Map<string, Array<?{ newValue: ?string, oldValue: ?string }>>
declare type ValueChanges = { [key: Name]: Array<?[?string, ?string]> };

declare type FormElements = u.MultiValueMap<Name, FormComponentElement>;

const DEFAULT_SYNC_INTERVAL = 500;

export default class HTMLStorageFormElement extends HTMLFormElement {
  values: Values;
  formElements: FormElements;

  syncTask: ?u.CancellablePromise<void>;

  scanTask: ?u.CancellablePromise<void>;
  scanIntervalMillis: number;

  get autosync(): number {
    const n = parseInt(getAttr(this, "autosync"));
    return n > 0 ? n : DEFAULT_SYNC_INTERVAL;
  }
  set autosync(v: any) { setAttr(this, "autosync", v); }
  get area(): string { return getAttr(this, "area"); }
  set area(v: any) { setAttr(this, "area", v); }

  constructor() {
    super();
  }

  createdCallback() {
    this.values = {};
    this.formElements = new u.MultiValueMap();
    this.scanIntervalMillis = 700;

    this.addEventListener("submit", (event) => {
      event.preventDefault();
      this.store();
    });

    this.startPeriodicalScan();

    if (this.isAutoSyncEnabled())
      this.startPeriodicalSync();
  }

  async attachedCallback() {
    await this.scanFormComponents();

    this.startPeriodicalScan();

    if (this.isAutoSyncEnabled())
      this.startPeriodicalSync();
  }

  detachedCallback() {
    if (this.storageSyncTask != null)
      clearTimeout(this.storageSyncTask);
    this.stopPeriodicalScan();
  }

  async startPeriodicalScan() {
    if (this.scanTask != null) return;
    while (true) { // this loop will break by stopPeriodicalScan()
      this.scanTask = u.sleep(this.scanIntervalMillis);
      await this.scanTask;
      await this.scanFormComponents();
    }
  }
  stopPeriodicalScan() {
    if (this.scanTask == null) return;
    this.scanTask.cancell();
    this.scanTask = null;
  }

  async startPeriodicalSync() {
    if (this.syncTask != null) return;
    while (true) { // this loop will break by stopPeriodicalSync()
      this.syncTask = u.sleep(this.autosync);
      await this.syncTask;
      await this.sync();
    }
  }
  stopPeriodicalSync() {
    if (this.syncTask == null) return;
    this.syncTask.cancell();
    this.syncTask = null;
  }

  async scanFormComponents() {
    const lastElements = this.getFormElementSet();
    const currentElements = this.getCurrentElements();

    this.formElements = Array.from(currentElements).reduce((map: FormElements, e) => {
      map.add(e.name, e);
      return map;
    }, new u.MultiValueMap());

    const added = u.subtractSet(currentElements, lastElements);
    if (added.size > 0) {
      added.forEach(this.initComponent, this);
      const addedNames = Array.from(added).map(e => e.name);
      await this.load(addedNames);
      await this.store(addedNames);
    }

    const removedNames = u.subtractSet(names(lastElements),
                                       names(currentElements));
    if (removedNames.size > 0) {
      for (const n of removedNames) {
        console.debug("Removed name: %o", n);
        delete this.values[n];
      }
    }
  }

  getCurrentElements(): Set<FormComponentElement> {
    return new Set(Array.from(this.elements).filter((e: NamableHTMLElement) => e.name));
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

  /// partial load if `names` was provided
  async load(names?: Array<string>) {
    const storageValues = await this.readStorageAll();
    const storageChanges =  this.diffValues(storageValues, this.values);

    if (!names) names = Object.keys(storageChanges);

    if (names.length === 0) return;

    const subChanges = {};
    for (const n of names) {
      this.values[n] = storageValues[n];
      subChanges[n] = storageChanges[n] || [];
    }
    this.writeForm(subChanges);
  }

  /// partial store if `names` was provided
  async store(names?: Array<string>) {
    const formValues = this.readFormAll();
    const formChanges = this.diffValues(formValues, this.values);

    if (!names) names = Object.keys(formChanges);

    if (names.length === 0) return;

    const subChanges = {};
    for (const n of names) {
      this.values[n] = formValues[n];
      subChanges[n] = formChanges[n] || [];
    }
    await this.writeStorage(subChanges);
  }

  diffValues(newValues: Values, oldValues: Values): ValueChanges {
    const names: Array<string> = u.dedup(Object.keys(newValues).concat(Object.keys(oldValues)));
    return names.reduce((result: ValueChanges, name: string): ValueChanges => {
      if (newValues[name] == null) newValues[name] = [];
      if (oldValues[name] == null) oldValues[name] = [];
      const values = [];
      const len = Math.max(newValues[name].length, oldValues[name].length);
      for (let i = 0; i < len; i++) {
        const newValue = newValues[name][i];
        const oldValue = oldValues[name][i];
        values[i] = newValue === oldValue ? null : [newValue, oldValue];
      }
      if (values.some((v) => v !== null))
        result[name] = values;
      return result;
    }, {});
  }

  async readStorageAll(): Promise<Values> {
    // start all data fatching at first
    const ps = Array.from(this.formElements.flattenValues())
          .reduce((values, e) => {
            const n = e.name;
            values[n] = this.readStorageByName(n);
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

      if (newValue == null) {
        console.debug("remove from storage: name=%o", name);
        await handler.removeItem(name);
      } else {
        console.debug("write to storage: name=%o, value=%o", name, newValue);
        await handler.write(name, newValue);
      }
    });
    await Promise.all(promises);
  }

  readFormAll(): Values {
    return Array.from(this.formElements.flattenValues())
      .reduce((items: Values, element) => {
        if (element.value == null) return items;

        const n = element.name;
        if (items[n] == null) items[n] = [];

        if (element.type === "checkbox" || element.type === "radio") {
          if (element.checked) items[n].unshift(element.value);
          return items;
        }

        // expand a <select> element to <option> elements.
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

  async sync() {
    await this.load();
    await this.store();
  }

  isAutoSyncEnabled(): boolean {
    return this.hasAttribute("autosync");
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
      if (this.isAutoSyncEnabled()) {
        this.startPeriodicalSync();
      } else {
        this.stopPeriodicalSync();
      }
      break;
    case "area":
      this.values = {};
      this.formElements = new u.MultiValueMap();
      break;
    }
  }
}

function names(iter: Iterable<FormComponentElement>): Set<string> {
  return new Set(map(iter, (v) => v.name));
}
function map<T, U>(iter: Iterable<T>,
                   callbackfn: (value: T, index: number, array: Array<T>) => U,
                   thisArg?: any): Array<U> {
  return Array.from(iter).map(callbackfn, thisArg);
}
function getAttr(self: HTMLElement, name: string): string {
  const v = self.getAttribute(name);
  return v ? v : "";
}
function setAttr(self: HTMLElement, name: string, value: ?string) {
  if (value == null) return;
  self.setAttribute(name, value);
}
