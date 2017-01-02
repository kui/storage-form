import * as u from "./utils";

declare type Name = string;
declare type Value = string;
declare type NameValue = { name: Name, value: ?Value };
declare type Values = Map<Element, NameValue>;
export interface Element {
  name: Name;
}
declare interface StorageHandler {
  read(n: Name): Promise<?Value>;
  write(n: Name, v: Value): Promise<void>;
  remove(n: Name):Promise<void>;
}
declare interface FormHandler {
  write(e: Element, v: ?Value): void;
  read(e: Element): ?Value;
}

export default class Binder {
  v: Values;
  s: StorageHandler;
  f: FormHandler;
  lock: ?Promise<mixed>;

  constructor(s: StorageHandler, f: FormHandler) {
    this.v = new Map;
    this.s = s;
    this.f = f;
    this.lock = null;
  }

  async sync(targets: Array<Element>): Promise<void> {
    await syncBlock(this, () => doSync(this, targets));
  }

  /// Force write form values to the storage
  async submit(targets: Array<Element>): Promise<void> {
    await syncBlock(this, () => Promise.all(targets.map(async (e) => {
      await store(this, e);
    })));
  }

  /// Sync only new elements
  async scan(targets: Array<Element>): Promise<void> {
    await syncBlock(this, async () => {
      const newElements = u.subtractSet(new Set(targets), new Set(this.v.keys()));
      await doSync(this, Array.from(newElements));
    });
  }

  /// Invork if an element was removed from a form.
  async remove(elements: Array<Element>) {
    await syncBlock(this, async () => {
      for (const e of elements) this.v.delete(e);
    });
  }
}

async function doSync(self: Binder, targets: Array<Element>) {
  await Promise.all(targets.map(async (e) => {
    await load(self, e);
    await store(self, e);
  }));
}

async function syncBlock(self: Binder, fn: () => Promise<mixed>) {
  while (self.lock) await self.lock;
  self.lock = fn();
  await self.lock;
  self.lock = null;
}

async function load(self: Binder, elem: Element): Promise<void> {
  const newN = elem.name;
  const newV = await self.s.read(newN);
  let nv: ?NameValue = self.v.get(elem);
  if (!nv) {
    nv = { name: elem.name, value: null };
    self.v.set(elem, nv);
  }
  if (nv.name !== newN || nv.value !== newV) {
    self.f.write(elem, newV);
    nv.name =  newN;
    nv.value =  newV;
  }
}

async function store(self: Binder, elem: Element): Promise<void> {
  const newN = elem.name;
  const newV = fallbackIfNull(() => self.f.read(elem),
                              () => getValueByName(self, newN));
  let nv: ?NameValue = self.v.get(elem);
  if (!nv) {
    nv = { name: elem.name, value: null };
    self.v.set(elem, nv);
  }
  if (nv.name !== newN || nv.value !== newV) {
    if (newV == null) {
      await self.s.remove(newN);
    } else {
      await self.s.write(newN, newV);
    }
    nv.name =  newN;
    nv.value =  newV;
  }
}

function fallbackIfNull<T>(...fns: Array<() => T>): ?T {
  for (const fn of fns) {
    const v = fn();
    if (v != null) return v;
  }
  return null;
}

function getValueByName(self: Binder, name: Name): ?Value {
  for (const nv of self.v.values()) {
    if (nv.name === name) return nv.value;
  }
  return null;
}
