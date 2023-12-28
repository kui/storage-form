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
  constructor(private readonly setFactory: (name: string) => S) {
    super();
  }

  add(v: V) {
    let s = this.get(v.name);
    if (!s) {
      s = this.setFactory(v.name);
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

export function mapKeyValues<K1, K2, V1, V2>(
  map: Map<K1, V1>,
  keyMapper: (k: K1, v: V1) => K2,
  valueMapper: (k: K1, v: V1) => V2,
): Map<K2, V2> {
  const result = new Map<K2, V2>();
  for (const [k, v] of map) result.set(keyMapper(k, v), valueMapper(k, v));
  return result;
}

export function mapValues<K, V1, V2>(
  map: Map<K, V1>,
  mapper: (k: K, v: V1) => V2,
): Map<K, V2> {
  return mapKeyValues(map, (k) => k, mapper);
}
