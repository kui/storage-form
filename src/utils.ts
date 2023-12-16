export class CancellablePromise extends Promise {
  constructor(callback, cancell) {
    super(callback);
    this.cancell = cancell;
  }
}

export function sleep(msec) {
  let timeoutId;
  return new CancellablePromise(
    resolve => {
      timeoutId = setTimeout(() => resolve(), msec);
    },
    () => {
      clearTimeout(timeoutId);
    }
  );
}

export function periodicalTask(o) {
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

export function dedup(array, predicate = (t, o) => t === o) {
  return array.reduce((result, element) => {
    if (result.some(i => predicate(i, element))) result;
    return result.concat(element);
  }, []);
}

export function subtractSet(targetSet, removedSet) {
  return new Set(Array.from(targetSet).filter(e => !removedSet.has(e)));
}

class MultiValueMap extends Map {
  *flattenValues() {
    for (const arr of this.values()) {
      for (const v of arr) {
        yield v;
      }
    }
  }
}

export class ArrayValueMap extends MultiValueMap {
  add(key, value) {
    let a = this.get(key);
    if (!a) {
      a = [];
      this.set(key, a);
    }
    a.push(value);
    return this;
  }
  getOrSetEmpty(key) {
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

export class SetValueMap extends MultiValueMap {
  add(key, value) {
    let a = this.get(key);
    if (!a) {
      a = new Set();
      this.set(key, a);
    }
    a.add(value);
    return this;
  }
}

export function mergeNextPromise(task) {
  let currentPromise;
  let nextPromise;
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
