// @flow

export class CancellablePromise<R> extends Promise<R> {
  cancell: () => void;
  constructor(
    callback: (
      resolve: (result: Promise<R> | R) => void,
      reject: (error: any) => void
    ) => mixed,
    cancell: () => void
  ) {
    super(callback);
    this.cancell = cancell;
  }
}

export function sleep(msec: number): CancellablePromise<void> {
  let timeoutId: ?number;
  return new CancellablePromise(
    (resolve) => {
      timeoutId = setTimeout(() => resolve(), msec);
    },
    () => {
      clearTimeout(timeoutId);
    }
  );
}

declare type PeriodicalTask = { interval: () => number, task: () => Promise<void> };

export function periodicalTask(o: PeriodicalTask): CancellablePromise<void> {
  let sleepPromise;
  return new CancellablePromise(
    async () => {
      do {
        await o.task();
        sleepPromise = sleep(o.interval());
        await sleepPromise;
      } while (sleepPromise);
    },
    () => {
      if (sleepPromise) sleepPromise.cancell();
      sleepPromise = null;
    }
  );
}

export function dedup<T>(array: Array<T>,
                         predicate?: (t: T, o: T) => boolean = (t, o) => t === o): Array<T> {
  return array.reduce((result: Array<T>, element) => {
    if (result.some((i) => predicate(i, element))) result;
    return result.concat(element);
  },[]);
}

export function subtractSet<T>(targetSet: Set<T>, removedSet: Set<T>): Set<T> {
  return new Set(Array.from(targetSet).filter((e) => !removedSet.has(e)));
}

class MultiValueMap<K, V, I: Iterable<V>> extends Map<K, I> {
  * flattenValues(): Iterator<V> {
    for (const arr of this.values()) {
      for (const v of arr) {
        yield v;
      }
    }
  }
}

export class ArrayValueMap<K, V> extends MultiValueMap<K, V, Array<V>> {
  add(key: K, value: V): this {
    let a = this.get(key);
    if (!a) {
      a = [];
      this.set(key, a);
    }
    a.push(value);
    return this;
  }
  getOrSetEmpty(key: K): Array<V> {
    const v = super.get(key);
    if (v == null) {
      const n = [];
      super.set(key, n);
      return n;
    } else {
      return v;
    }
  }
}

export class SetValueMap<K, V> extends MultiValueMap<K, V, Set<V>> {
  add(key: K, value: V): this {
    let a = this.get(key);
    if (!a) {
      a = new Set();
      this.set(key, a);
    }
    a.add(value);
    return this;
  }
}

export function mergeNextPromise(task: () => Promise<void>): () => Promise<void> {
  let currentPromise: ?Promise<void>;
  let nextPromise: ?Promise<void>;
  return async () => {
    if (nextPromise) {
      await nextPromise;
      return;
    }

    if (currentPromise) {
      nextPromise = (async () => {
        if (currentPromise) {
          await currentPromise;
        }
        nextPromise = null;

        currentPromise = task();
        await currentPromise;
        currentPromise = null;
      })();
      await nextPromise;
      return;
    }

    currentPromise = (async () => {
      await task();
      currentPromise = null;
    })();
    await currentPromise;
  };
}
