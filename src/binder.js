// @flow

declare interface DiffValue {
  isChanged: boolean;
}

export interface StorageHandler<Key, Value, Changes: DiffValue> {
  write(c: Iterator<[Key, Changes]>): Promise<void>;
  readAll(): Promise<Map<Key, Value>>;
}

export interface DataHandler<Key, Value, Changes: DiffValue> {
  a: StorageHandler<Key, Value, Changes>;
  b: StorageHandler<Key, Value, Changes>;
  diff(oldValue: ?Value, newValue: ?Value): Changes;
}

export default class Binder<Key, Value, Changes: DiffValue> {
  handler: DataHandler<Key, Value, Changes>;
  values: Map<Key, Value>;
  lock: ?Promise<any>;
  onChange: (type: "atob" | "btoa" | "sync") => Promise<void>;

  constructor(handler: DataHandler<Key, Value, Changes>) {
    this.handler = handler;
    this.values = new Map;
    this.lock = null;
  }

  async aToB() {
    const hasChanged = await lockBlock(this, () => readAndWrite(this, this.handler.a, this.handler.b));
    if (hasChanged && this.onChange) await this.onChange("atob");
  }

  async bToA() {
    const hasChanged = await lockBlock(this, () => readAndWrite(this, this.handler.b, this.handler.a));
    if (hasChanged && this.onChange) await this.onChange("btoa");
  }

  async sync() {
    let hasChanged = false;
    await lockBlock(this, async () => {
      hasChanged = (await readAndWrite(this, this.handler.a, this.handler.b)) || hasChanged;
      hasChanged = (await readAndWrite(this, this.handler.b, this.handler.a)) || hasChanged;
    });
    if (hasChanged && this.onChange) await this.onChange("sync");
  }
}

async function lockBlock<K, V, C: DiffValue, T>(self: Binder<K, V, C>, fn: () => Promise<T>): Promise<T> {
  while (self.lock) await self.lock;
  self.lock = fn();
  const t = await self.lock;
  self.lock = null;
  return t;
}

async function readAndWrite<K, V, C: DiffValue, H: StorageHandler<K, V, C>>(
  self: Binder<K, V, C>,from: H,to: H): Promise<boolean> {
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
  await to.write(changes);
  return hasChanged;
}

function* concat<K>(...iters: Iterable<K>[]): Iterator<K> {
  for (const iter of iters) for (const k of iter) yield k;
}

function* map<T, U>(iter: Iterable<T>, fn: (t: T) => U): Iterator<U> {
  for (const t of iter) yield fn(t);
}
