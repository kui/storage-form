import * as utils from "./utils";
import * as ah from "./area-handler";
import Binder from "./binder";
import type { BinderIO, ValueChange } from "./binder";

interface Bindee {
  getTarget(): HTMLElement;
  getArea(): string;
  getNames(): Iterable<string>;
  getElements(): Iterable<Element>;
  isAutoLoad(): boolean;
  isAutoSync(): boolean;
  getInterval(): number;
}

export interface Change {
  type: "load" | "submit" | "sync";
  target: HTMLElement;
  isForce: boolean;
}

interface AreaHandler {
  read(names: string[]): Promise<Record<string, string>>;
  write(items: Record<string, string>): Promise<void>;
}

const EVENT_TYPE_MAP = {
  atob: "load",
  btoa: "submit",
  sync: "sync",
} as const;

export default class StorageBinder {
  autoTask: utils.CancellablePromise<void> | null;
  doAutoTask: () => Promise<void>;
  binder: Binder | null = null;
  onChange: ((e: Change) => Promise<void> | void) | null = null;

  constructor(private readonly bindee: Bindee) {
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
    this.binder.onChange = async (event) => {
      const type = EVENT_TYPE_MAP[event.type];
      const e = {
        type,
        target: this.bindee.getTarget(),
        isForce: event.isForce,
      };
      console.debug("onChange: ", e);
      if (this.onChange) {
        await this.onChange(e);
      }
    };
  }

  async load(o: { force: boolean } = { force: false }) {
    await this.binder?.aToB(o);
  }

  async submit(o: { force: boolean } = { force: false }) {
    await this.binder?.bToA(o);
  }

  async sync() {
    await this.binder?.sync();
  }

  startAutoBinding() {
    if (this.autoTask) this.autoTask.cancell();

    if (this.bindee.isAutoLoad() || this.bindee.isAutoSync()) {
      this.autoTask = utils.periodicalTask({
        interval: () => this.bindee.getInterval(),
        task: this.doAutoTask,
      });
    } else {
      this.autoTask = null;
    }
  }
}

function initBinder(bindee: Bindee) {
  return new Binder({
    a: new StorageAreaHandler(bindee),
    b: new FormHandler(bindee),
    diff(oldValue, newValue) {
      return {
        change: { oldValue, newValue },
        isChanged: oldValue !== newValue,
      };
    },
  });
}

class StorageAreaHandler implements BinderIO {
  handler: AreaHandler | null;

  constructor(private readonly bindee: Bindee) {
    this.handler = getAreaHandler(bindee);
  }

  async readAll() {
    if (!this.handler) return new Map();
    const o = await this.handler.read(Array.from(this.bindee.getNames()));
    const a = Object.entries(o).filter(([, v]) => v != null);
    return new Map(a);
  }

  async write(changes: Map<string, ValueChange>) {
    if (!this.handler) return;
    const items: Record<string, string> = {};
    for (const [key, { newValue }] of changes) {
      items[key] = newValue ?? "";
    }
    await this.handler.write(items);
  }
}

function getAreaHandler(bindee: Bindee) {
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

class FormHandler implements BinderIO {
  constructor(private readonly bindee: Bindee) {}

  readAll() {
    const items = new Map<string, string>();
    for (const e of this.bindee.getElements()) {
      const name = e.getAttribute("name");
      if (!name) continue; // filter out empty named elements
      const prevValue = items.get(name);
      if (prevValue) continue; // empty value should update other values such as radio list.
      const value = readValue(e);
      if (value == null) continue;
      items.set(name, value);
    }
    return Promise.resolve(items);
  }

  write(changes: Map<string, ValueChange>) {
    for (const e of this.bindee.getElements()) {
      const name = e.getAttribute("name");
      if (!name) continue; // filter out empty named elements
      const change = changes.get(name);
      if (!change) continue;
      const value = change.newValue ?? "";
      writeValue(e, value);
    }
    return Promise.resolve();
  }
}

function readValue(e: Element) {
  if (e instanceof HTMLInputElement && ["checkbox", "radio"].includes(e.type)) {
    if (e.checked) return e.value;
    if (e.dataset.uncheckedValue) return e.dataset.uncheckedValue;
    return "";
  } else if ((e as HTMLInputElement).value != null) {
    return (e as HTMLInputElement).value;
  }
}

function writeValue(e: Element, value: string) {
  if (e instanceof HTMLInputElement && ["checkbox", "radio"].includes(e.type)) {
    e.checked = e.value === value;
  } else if ((e as HTMLInputElement).value != null) {
    (e as HTMLInputElement).value = value;
  }
}
