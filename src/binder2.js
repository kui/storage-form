// @flow

type Iter<E> = Iterable<E> | Iterator<E>;

export interface StorageHandler<Key, Value, Changes> {
  write(c: Iter<[Key, Changes]>): Promise<void>;
  readAll(): Promise<Map<Key, Value>>;
  delete(keys: Iter<Key>): Promise<void>
}

export interface DataHandler<Key, Value, Changes> {
  a: StorageHandler<Key, Value, Changes>;
  b: StorageHandler<Key, Value, Changes>;
  diff(oldValues: Map<Key, Value>, newValues: Map<Key, Value>): Iter<[Key, Changes]>;
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

async function readAndWrite<K, V, C, H: StorageHandler<K, V, C>>(self: Binder<K, V, C>,
                                                                 from: H,
                                                                 to: H): Promise<void> {
  const newValue = await from.readAll();
  const changes = self.handler.diff(self.values, newValue);
  self.values = newValue;
  await to.write(changes);
}
