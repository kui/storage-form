export class CancellablePromise<R> extends Promise<R> {
  cancellFunction: () => void;
  constructor(
    callback: (
      resolve: (result: Promise<R> | R) => void,
      reject: (error: any) => void
    ) => mixed,
    cancell: () => void
  ) {
    super(callback);
    this.cancellFunction = cancell;
  }

  cancell() {
    this.cancellFunction();
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

export function dedup<T>(array: Array<T>, predicate?: (t: T, o: T) => boolean = (t, o) => t === o): Array<T> {
  return array.reduce((result: Array<T>, element) => {
    if (result.some((i) => predicate(i, element))) result;
    return result.concat(element);
  },[]);
}

export function subtractSet<T>(targetSet: Set<T>, removedSet: Set<T>): Set<T> {
  return new Set(Array.from(targetSet).filter((e) => !removedSet.has(e)));
}

export class MultiValueMap<K, V> extends Map<K, Array<V>> {
  add(key: K, value: V): this {
    let a = this.get(key);
    if (!a) {
      a = [];
      this.set(key, a);
    }
    a.unshift(value);
    return this;
  }

  * flattenValues(): Iterator<V> {
    for (const arr of this.values()) {
      for (const v of arr) {
        yield v;
      }
    }
  }
}
