// @flow

export interface StorageHandler<Key, Value, Changes> {
  write(c: Iterator<[Key, Changes]>): Promise<void>;
  readAll(): Promise<Map<Key, Value>>;
}

export interface DataHandler<Key, Value, Changes> {
  a: StorageHandler<Key, Value, Changes>;
  b: StorageHandler<Key, Value, Changes>;
  diff(oldValue: ?Value, newValue: ?Value): Changes;
}

export default class Binder<Key, Value, Changes> {
  handler: DataHandler<Key, Value, Changes>;
  values: Map<Key, Value>;
  lock: ?Promise<any>;

  constructor(handler: DataHandler<Key, Value, Changes>) {
    this.handler = handler;
    this.values = new Map;
    this.lock = null;
  }

  async aToB() {
    await lockBlock(this, () => readAndWrite(this, this.handler.a, this.handler.b));
  }

  async bToA() {
    await lockBlock(this, () => readAndWrite(this, this.handler.b, this.handler.a));
  }

  async sync() {
    await lockBlock(this, async () => {
      await readAndWrite(this, this.handler.a, this.handler.b);
      await readAndWrite(this, this.handler.b, this.handler.a);
    });
  }
}

async function lockBlock<K, V, C>(self: Binder<K, V, C>, fn: () => Promise<any>) {
  while (self.lock) await self.lock;
  self.lock = fn();
  await self.lock;
  self.lock = null;
}

async function readAndWrite<K, V, C, H: StorageHandler<K, V, C>>(
  self: Binder<K, V, C>,from: H,to: H): Promise<void> {
  const newValues = await from.readAll();
  const oldValues = self.values;
  self.values = newValues;
  const keys: Set<K> = new Set(concat(oldValues.keys(), newValues.keys()));
  const changes = map(keys, (k) => [k, self.handler.diff(oldValues.get(k), newValues.get(k))]);
  await to.write(changes);
}

function* concat<K>(...iters: Iterable<K>[]): Iterator<K> {
  for (const iter of iters) for (const k of iter) yield k;
}

function* map<T, U>(iter: Iterable<T>, fn: (t: T) => U): Iterator<U> {
  for (const t of iter) yield fn(t);
}
