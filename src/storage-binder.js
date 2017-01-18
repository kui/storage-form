// @flow

import * as utils from "./utils";
import * as ah from "./area-handler";
import Binder from "./binder";

import type { Diff, DataHandler, StorageHandler } from "./binder";

export interface Bindee {
  getArea(): ah.Area;
  isAutoSync(): boolean;
  isAutoLoad(): boolean;
  getInterval(): number;
  getElements(): Iterable<HTMLElement>;
  getNames(): Iterable<string>;
  getTarget(): HTMLElement;
}

declare type Change = { oldValue: ?string, newValue: ?string };

declare type ChangeEvent = {
  type: "load" | "submit" | "sync",
  target: HTMLElement,
  isForce: boolean,
};

export default class StorageBinder {
  bindee: Bindee;
  binder: Binder<string, string, Change>;
  doAutoTask: () => Promise<void>;
  autoTask: ?utils.CancellablePromise<void>;

  onChange: (e: ChangeEvent) => Promise<void>;

  constructor(bindee: Bindee) {
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
    this.binder.onChange = async (event) => {
      const type = { atob: "load", btoa: "submit", sync: "sync"}[event.type];
      const e = { type, target: this.bindee.getTarget(), isForce: event.isForce };
      console.debug("onChange: ", e);
      if (this.onChange) {
        await this.onChange(e);
      }
    };
  }

  async load(o?: { force: boolean }) {
    await this.binder.aToB(o);
  }

  async submit(o?: { force: boolean }) {
    await this.binder.bToA(o);
  }

  async sync() {
    await this.binder.sync();
  }

  async startAutoBinding() {
    if (this.autoTask) this.autoTask.cancell();

    if (this.bindee.isAutoLoad() || this.bindee.isAutoSync() ) {
      this.autoTask = utils.periodicalTask({
        interval: () => this.bindee.getInterval(),
        task: this.doAutoTask,
      });
    } else {
      this.autoTask = null;
    }
  }
}

function initBinder(bindee: Bindee): Binder<string, string, Change> {
  return new Binder(({
    a: (new StorageAreaHandler(bindee): StorageHandler<string, string, Change>),
    b: (new FormHandler(bindee): StorageHandler<string, string, Change>),
    diff(oldValue: ?string, newValue: ?string): Diff<Change> {
      return { change: { oldValue, newValue }, isChanged: (oldValue !== newValue) };
    }
  }: DataHandler<string, string, Change>));
}

class StorageAreaHandler {
  bindee: Bindee;
  handler: ?ah.AreaHandler;

  constructor(bindee: Bindee) {
    this.bindee = bindee;
    const h = getAreaHandler(bindee);
    this.handler = h;
  }

  async readAll(): Promise<Map<string, string>> {
    if (!this.handler) return new Map;
    const o: { [n: string]: string } = (await this.handler.read(Array.from(this.bindee.getNames())): any);
    const a = (Object.entries(o)).filter(([, v]) => v != null);
    return new Map(a);
  }

  async write(changes: Map<string, Change>): Promise<void> {
    if (!this.handler) return;
    const items = {};
    for (const [key, { newValue }] of changes) {
      items[key] = newValue || "";
    }
    await this.handler.write(items);
  }
}

function getAreaHandler(bindee: Bindee): ?ah.AreaHandler {
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
  bindee: Bindee;

  constructor(bindee: Bindee) {
    this.bindee = bindee;
  }

  readAll() {
    const items = new Map;
    for (const e of this.bindee.getElements()) {
      const name: ?string = (e: any).name;
      if (!name) continue; // filter out empty named elements
      const prevValue = items.get(name);
      if (prevValue) continue; // empty value should update other values such as radio list.
      const value = readValue(e);
      if (value == null) continue;
      items.set(name, value);
    }
    return Promise.resolve(items);
  }

  write(changes: Map<string, Change>) {
    for (const e of this.bindee.getElements()) {
      const name: ?string = (e: any).name;
      if (!name) continue; // filter out empty named elements
      const change = changes.get(name);
      if (!change) continue;
      const value = change.newValue || "";
      writeValue(e, value);
    }
    return Promise.resolve();
  }
}

function readValue(e: HTMLElement): ?string {
  if ((e instanceof HTMLInputElement) && ["checkbox", "radio"].includes(e.type)) {
    if (e.checked) return e.value;
    if (e.dataset.uncheckedValue) return e.dataset.uncheckedValue;
    return "";
  } else if (e.value != null) {
    return (e: any).value;
  }
}

function writeValue(e: HTMLElement, value: string) {
  if ((e instanceof HTMLInputElement) && ["checkbox", "radio"].includes(e.type)) {
    e.checked = e.value === value;
  } else if (e.value != null) {
    (e: any).value = value;
  }
}
