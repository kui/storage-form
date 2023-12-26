interface Named {
  name: string;
}

interface SetLike<V> {
  add(value: V): void;
  delete(value: V): boolean;
  size: number;
  [Symbol.iterator](): IterableIterator<V>;
}

export class NamedSetMap<S extends SetLike<V>, V extends Named> extends Map<
  string,
  S
> {
  constructor(private readonly setConstructor: new () => S) {
    super();
  }

  add(v: V) {
    let s = this.get(v.name);
    if (!s) {
      s = new this.setConstructor();
      this.set(v.name, s);
    }
    s.add(v);
    return this;
  }

  deleteByKeyValue(k: string, v: V): boolean {
    const s = this.get(k);
    return s && s.delete(v) && s.size === 0 ? this.delete(k) : false;
  }

  deleteByValue(v: V): boolean {
    return this.deleteByKeyValue(v.name, v);
  }

  *flattenValues() {
    for (const s of this.values()) yield* s;
  }
}

export function setAll<K, V>(
  map: Map<K, V>,
  newEntries: Iterable<[K, V]>,
): void {
  for (const [k, v] of newEntries) map.set(k, v);
}
