export class CancellablePromise<T> extends Promise<T> {
  constructor(
    callback: (
      resolve: (value: T | PromiseLike<T>) => void,
      reject: (reason?: unknown) => void,
    ) => void,
    readonly cancell: () => void,
  ) {
    super(callback);
  }
}

export function sleep(msec: number): CancellablePromise<void> {
  let timeoutId: ReturnType<typeof setTimeout>;
  return new CancellablePromise(
    (resolve) => {
      timeoutId = setTimeout(() => resolve(), msec);
    },
    () => {
      clearTimeout(timeoutId);
    },
  );
}

export function periodicalTask({
  task,
  interval,
}: {
  task: () => Promise<void>;
  interval: () => number;
}): CancellablePromise<void> {
  let sleepPromise: CancellablePromise<void> | null = null;
  return new CancellablePromise(
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async () => {
      do {
        await task();
        sleepPromise = sleep(interval());
        await sleepPromise;
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
      } while (sleepPromise);
    },
    () => {
      if (sleepPromise) sleepPromise.cancell();
      sleepPromise = null;
    },
  );
}

export function dedup<T>(array: T[], predicate = (t: T, o: T) => t === o): T[] {
  return array.reduce<T[]>((result, element) => {
    if (result.some((i) => predicate(i, element))) result;
    return result.concat(element);
  }, []);
}

export function subtractSet<T>(targetSet: Set<T>, removedSet: Set<T>) {
  return new Set(Array.from(targetSet).filter((e) => !removedSet.has(e)));
}

class MultiValueMap<K, V, VV extends Iterable<V>> extends Map<K, VV> {
  *flattenValues() {
    for (const arr of this.values()) {
      for (const v of arr) {
        yield v;
      }
    }
  }
}

export class ArrayValueMap<K, V> extends MultiValueMap<K, V, V[]> {
  add(key: K, value: V) {
    let a = this.get(key);
    if (!a) {
      a = [];
      this.set(key, a);
    }
    a.push(value);
    return this;
  }
  getOrSetEmpty(key: K) {
    let v = super.get(key);
    if (!v) {
      v = [];
      super.set(key, v);
    }
    return v;
  }
}

export class SetValueMap<K, V> extends MultiValueMap<K, V, Set<V>> {
  add(key: K, value: V) {
    let a = this.get(key);
    if (!a) {
      a = new Set();
      this.set(key, a);
    }
    a.add(value);
    return this;
  }
}

export function mergeNextPromise(task: () => Promise<void>) {
  let currentPromise: Promise<void> | null = null;
  let nextPromise: Promise<void> | null = null;
  return async () => {
    if (nextPromise) {
      await nextPromise;
      return;
    }

    if (currentPromise) {
      nextPromise = (async () => {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
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
