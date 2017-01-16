// @flow

import * as utils from "./utils";
import * as ah from "./area-handler";
import Binder from "./binder";

import type { DataHandler, StorageHandler } from "./binder";

interface StorageForm {
  area: ah.Area;
  elements: HTMLCollection<HTMLElement>;
}

declare type Change = { oldValue: ?string, newValue: ?string };

export default class StorageFormBinder {
  form: StorageForm;
  binder: Binder<string, string, Change>;

  constructor(form: StorageForm) {
    this.form = form;
    this.init();
  }

  init() {
    this.binder = initBinder(this.form);
  }
}

function initBinder(form: StorageForm): Binder<string, string, Change> {
  return new Binder(({
    a: (new StorageAreaHandler(form): StorageHandler<string, string, Change>),
    b: new FormHandler(form),
    diff(oldValue: ?string, newValue: ?string): Change {
      return { oldValue, newValue };
    }
  }: DataHandler<string, string, Change>));
}

class StorageAreaHandler {
  form: StorageForm;
  handler: ah.AreaHandler;

  constructor(form: StorageForm) {
    this.form = form;
    const h = getAreaHandler(form);
    if (h == null) throw Error();
    this.handler = h;
  }

  async readAll(): Promise<Map<string, string>> {
    const names = getNames(this.form);
    const o = Object.entries(await this.handler.read(Array.from(names)))
          .filter(([, v]) => v != null);
    return new Map(o);
  }

  write(changes: Iterator<[string, Change]>): Promise<void> {
    const items = {};
    for (const [key, { newValue }] of changes)
      items[key] = newValue;
    return this.handler.write(items);
  }
}

function getNames(form: StorageForm): Iterator<string> {
  return filter(map(form.elements, (e) => (e: any).name),
                (n) => n != null);
}

function getAreaHandler(form: StorageForm): ?ah.AreaHandler {
  const a = form.area;
  if (!a) {
    console.debug("Require 'area' attribute", form);
    return null;
  }
  const h = ah.findHandler(a);
  if (!h) {
    console.debug("No such area handler: area=%s, form=%o", a, form);
    return null;
  }
  return h;
}

class FormHandler {
  form: StorageForm;

  constructor(form: StorageForm) {
    this.form = form;
  }
}

function* filter<E>(iter: Iterable<E>, predicate: (e: E) => boolean): Iterator<E> {
  for (const e of iter) if (predicate(e)) yield e;
}

function* map<E, EE>(iter: Iterable<E>, mapper: (e: E) => EE): Iterator<EE> {
  for (const e of iter) yield mapper(e);
}

function reduce<E, R>(iter: Iterable<E>, fn: (result: R, e: E) => R, initValue: R): R {
  let r = initValue;
  for (const e of iter) r = fn(r, e);
  return r;
}
