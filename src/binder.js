// @flow

export interface Diff<Change> {
  change: Change;
  isChanged: boolean;
}

export interface StorageHandler<Key, Value, Change> {
  write(c: Map<Key, Change>, isForce: boolean): Promise<void>;
  readAll(): Promise<Map<Key, Value>>;
}

export interface DataHandler<Key, Value, Change> {
  a: StorageHandler<Key, Value, Change>;
  b: StorageHandler<Key, Value, Change>;
  diff(oldValue: ?Value, newValue: ?Value): Diff<Change>;
}

export interface ValueChangeEvent<Key, Change> {
  type: "atob" | "btoa" | "sync";
  isForce: boolean;
  changes: Map<Key, Change>;
}

export default class Binder<Key, Value, Change> {
  handler: DataHandler<Key, Value, Change>;
  values: Map<Key, Value>;
  lock: ?Promise<any>;
  onChange: (e: ValueChangeEvent<Key, Change>) => Promise<void>;

  constructor(handler: DataHandler<Key, Value, Change>) {
    this.handler = handler;
    this.values = new Map;
    this.lock = null;
  }

  async aToB(o?: { force: boolean } = { force: false }) {
    const diff =
          await lockBlock(this, () => readAndWrite(this, this.handler.a, this.handler.b, o.force));
    if (diff.isChanged && this.onChange)
      await this.onChange({ type: "atob", isForce: o.force, changes: diff.change });
  }

  async bToA(o?: { force: boolean } = { force: false }) {
    const diff =
          await lockBlock(this, () => readAndWrite(this, this.handler.b, this.handler.a, o.force));
    if (diff.isChanged && this.onChange)
      await this.onChange({ type: "btoa", isForce: o.force, changes: diff.change });
  }

  async sync() {
    let hasChanged = false;
    const changes = new Map;
    await lockBlock(this, async () => {
      const d1 = await readAndWrite(this, this.handler.a, this.handler.b, false);
      const d2 = await readAndWrite(this, this.handler.b, this.handler.a, false);
      hasChanged = d1.isChanged || d2.isChanged;
      mergeMap(changes, d1.change);
      mergeMap(changes, d2.change);
    });
    if (hasChanged && this.onChange)
      await this.onChange({ type: "sync", isForce: false, changes });
  }
}

async function lockBlock<K, V, C, T>(self: Binder<K, V, C>, fn: () => Promise<T>): Promise<T> {
  while (self.lock) await self.lock;
  self.lock = fn();
  const t = await self.lock;
  self.lock = null;
  return t;
}

async function readAndWrite<K, V, C, H: StorageHandler<K, V, C>>(
  self: Binder<K, V, C>, from: H, to: H, isForce: boolean): Promise<Diff<Map<K, C>>> {
  const newValues = await from.readAll();
  const oldValues = self.values;
  self.values = newValues;
  const keys: Set<K> = new Set(concat(oldValues.keys(), newValues.keys()));
  let hasChanged = false;
  const changes = new Map(flatMap(keys, (k) => {
    const d = self.handler.diff(oldValues.get(k), newValues.get(k));
    if (d.isChanged || isForce) {
      hasChanged = true;
      return [[k, d.change]];
    }
    return [];
  }));
  if (changes.size > 0)
    await to.write(changes, isForce);
  return { isChanged: hasChanged, change: changes };
}

function* concat<K>(...iters: Iterable<K>[]): Iterator<K> {
  for (const iter of iters) for (const k of iter) yield k;
}

function* flatMap<T, U>(iter: Iterable<T>, fn: (t: T) => U[]): Iterator<U> {
  for (const t of iter) for (const u of fn(t)) yield u;
}

function mergeMap<K, V>(merger: Map<K, V>, target: Map<K, V>) {
  for (const [key, value] of target)
    merger.set(key, value);
}
