// @flow

declare interface DiffValue {
  isChanged: boolean;
}

export interface StorageHandler<Key, Value, Changes: DiffValue> {
  write(c: Iterator<[Key, Changes]>, isForce: boolean): Promise<void>;
  readAll(): Promise<Map<Key, Value>>;
}

export interface DataHandler<Key, Value, Changes: DiffValue> {
  a: StorageHandler<Key, Value, Changes>;
  b: StorageHandler<Key, Value, Changes>;
  diff(oldValue: ?Value, newValue: ?Value): Changes;
}

export interface ValueChangeEvent {
  type: "atob" | "btoa" | "sync";
  isForce: boolean;
}

export default class Binder<Key, Value, Changes: DiffValue> {
  handler: DataHandler<Key, Value, Changes>;
  values: Map<Key, Value>;
  lock: ?Promise<any>;
  onChange: (e: ValueChangeEvent) => Promise<void>;

  constructor(handler: DataHandler<Key, Value, Changes>) {
    this.handler = handler;
    this.values = new Map;
    this.lock = null;
  }

  async aToB(o?: { force: boolean } = { force: false }) {
    const hasChanged =
          await lockBlock(this, () => readAndWrite(this, this.handler.a, this.handler.b, o.force));
    if (hasChanged && this.onChange) await this.onChange({ type: "atob", isForce: o.force});
  }

  async bToA(o?: { force: boolean } = { force: false }) {
    const hasChanged =
          await lockBlock(this, () => readAndWrite(this, this.handler.b, this.handler.a, o.force));
    if (hasChanged && this.onChange) await this.onChange({ type: "btoa", isForce: o.force});
  }

  async sync() {
    let hasChanged = false;
    await lockBlock(this, async () => {
      hasChanged = (await readAndWrite(this, this.handler.a, this.handler.b, false)) || hasChanged;
      hasChanged = (await readAndWrite(this, this.handler.b, this.handler.a, false)) || hasChanged;
    });
    if (hasChanged && this.onChange) await this.onChange({ type: "sync", isForce: false});
  }
}

async function lockBlock<K, V, C: DiffValue, T>(self: Binder<K, V, C>, fn: () => Promise<T>): Promise<T> {
  while (self.lock) await self.lock;
  self.lock = fn();
  const t = await self.lock;
  self.lock = null;
  return t;
}

async function readAndWrite<K, V, C: DiffValue, H: StorageHandler<K, V, C>>(self: Binder<K, V, C>, from: H, to: H, isForce: boolean): Promise<boolean> {
  const newValues = await from.readAll();
  const oldValues = self.values;
  self.values = newValues;
  const keys: Set<K> = new Set(concat(oldValues.keys(), newValues.keys()));
  let hasChanged = false;
  const changes = map(keys, (k) => {
    const d = self.handler.diff(oldValues.get(k), newValues.get(k));
    hasChanged = hasChanged || d.isChanged;
    return [k, d];
  });
  await to.write(changes, isForce);
  return hasChanged;
}

function* concat<K>(...iters: Iterable<K>[]): Iterator<K> {
  for (const iter of iters) for (const k of iter) yield k;
}

function* map<T, U>(iter: Iterable<T>, fn: (t: T) => U): Iterator<U> {
  for (const t of iter) yield fn(t);
}
