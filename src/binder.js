export default class Binder {
  constructor(handler) {
    this.handler = handler;
    this.values = new Map();
    this.lock = null;
  }

  async aToB(o = { force: false }) {
    const diff = await lockBlock(this, () =>
      readAndWrite(this, this.handler.a, this.handler.b, o.force)
    );
    if (diff.isChanged && this.onChange)
      await this.onChange({
        type: "atob",
        isForce: o.force,
        changes: diff.change
      });
  }

  async bToA(o = { force: false }) {
    const diff = await lockBlock(this, () =>
      readAndWrite(this, this.handler.b, this.handler.a, o.force)
    );
    if (diff.isChanged && this.onChange)
      await this.onChange({
        type: "btoa",
        isForce: o.force,
        changes: diff.change
      });
  }

  async sync() {
    let hasChanged = false;
    const changes = new Map();
    await lockBlock(this, async () => {
      const d1 = await readAndWrite(
        this,
        this.handler.a,
        this.handler.b,
        false
      );
      const d2 = await readAndWrite(
        this,
        this.handler.b,
        this.handler.a,
        false
      );
      hasChanged = d1.isChanged || d2.isChanged;
      mergeMap(changes, d1.change);
      mergeMap(changes, d2.change);
    });
    if (hasChanged && this.onChange)
      await this.onChange({ type: "sync", isForce: false, changes });
  }
}

async function lockBlock(self, fn) {
  while (self.lock) await self.lock;
  self.lock = fn();
  const t = await self.lock;
  self.lock = null;
  return t;
}

async function readAndWrite(self, from, to, isForce) {
  const newValues = await from.readAll();
  const oldValues = self.values;
  self.values = newValues;
  const keys = new Set(concat(oldValues.keys(), newValues.keys()));
  let hasChanged = false;
  const changes = new Map(
    flatMap(keys, k => {
      const d = self.handler.diff(oldValues.get(k), newValues.get(k));
      if (d.isChanged || isForce) {
        hasChanged = true;
        return [[k, d.change]];
      }
      return [];
    })
  );
  if (changes.size > 0) await to.write(changes, isForce);
  return { isChanged: hasChanged, change: changes };
}

function* concat(...iters) {
  for (const iter of iters) for (const k of iter) yield k;
}

function* flatMap(iter, fn) {
  for (const t of iter) for (const u of fn(t)) yield u;
}

function mergeMap(merger, target) {
  for (const [key, value] of target) merger.set(key, value);
}
