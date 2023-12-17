export interface BinderHandler {
  a: BinderIO;
  b: BinderIO;
  diff(a: string | undefined, b: string | undefined): BinderDiff;
}

export interface BinderIO {
  readAll(): Promise<Map<string, string>>;
  write(changes: Map<string, ValueChange>, isForce: boolean): Promise<void>;
}

export interface BinderDiff {
  isChanged: boolean;
  change: ValueChange;
}

export interface ValueChange {
  oldValue: string | undefined;
  newValue: string | undefined;
}

export interface BinderEvent {
  type: "atob" | "btoa" | "sync";
  isForce: boolean;
  changes: Map<string, ValueChange>;
}

export default class Binder {
  values = new Map<string, string>();
  lock: Promise<unknown> | null = null;
  onChange: ((event: BinderEvent) => Promise<void>) | null = null;

  constructor(readonly handler: BinderHandler) {}

  async aToB(o: { force: boolean } = { force: false }) {
    const diff = await lockBlock(this, () =>
      readAndWrite(this, this.handler.a, this.handler.b, o.force),
    );
    if (diff.isChanged && this.onChange)
      await this.onChange({
        type: "atob",
        isForce: o.force,
        changes: diff.change,
      });
  }

  async bToA(o = { force: false }) {
    const diff = await lockBlock(this, () =>
      readAndWrite(this, this.handler.b, this.handler.a, o.force),
    );
    if (diff.isChanged && this.onChange)
      await this.onChange({
        type: "btoa",
        isForce: o.force,
        changes: diff.change,
      });
  }

  async sync() {
    let hasChanged = false;
    const changes = new Map<string, ValueChange>();
    await lockBlock(this, async () => {
      const d1 = await readAndWrite(
        this,
        this.handler.a,
        this.handler.b,
        false,
      );
      const d2 = await readAndWrite(
        this,
        this.handler.b,
        this.handler.a,
        false,
      );
      hasChanged = d1.isChanged || d2.isChanged;
      mergeMap(changes, d1.change);
      mergeMap(changes, d2.change);
    });
    if (hasChanged && this.onChange)
      await this.onChange({ type: "sync", isForce: false, changes });
  }
}

async function lockBlock<T>(self: Binder, fn: () => Promise<T>): Promise<T> {
  while (self.lock) await self.lock;
  const p = fn();
  self.lock = p;
  const t = await p;
  self.lock = null;
  return t;
}

async function readAndWrite(
  self: Binder,
  from: BinderIO,
  to: BinderIO,
  isForce: boolean,
) {
  const newValues = await from.readAll();
  const oldValues = self.values;
  self.values = newValues;
  const keys = new Set(concat(oldValues.keys(), newValues.keys()));
  let hasChanged = false;
  const changes = new Map(
    flatMap(keys, (k) => {
      const d = self.handler.diff(oldValues.get(k), newValues.get(k));
      if (d.isChanged || isForce) {
        hasChanged = true;
        return [[k, d.change]];
      }
      return [];
    }),
  );
  if (changes.size > 0) await to.write(changes, isForce);
  return { isChanged: hasChanged, change: changes };
}

function* concat<E>(...iters: Iterable<E>[]) {
  for (const iter of iters) for (const k of iter) yield k;
}

function* flatMap<E, U>(
  iter: Iterable<E>,
  fn: (e: E) => Iterable<U>,
): Generator<U> {
  for (const t of iter) for (const u of fn(t)) yield u;
}

function mergeMap<K, V>(merger: Map<K, V>, target: Map<K, V>) {
  for (const [key, value] of target) merger.set(key, value);
}
