interface Named {
  name: string;
}

interface NamedSetLike<V> {
  add(value: V): void;
  delete(value: V): boolean;
  size: number;
}

export class NamedSetMap<
  S extends NamedSetLike<V>,
  V extends Named,
> extends Map<string, S> {
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

  deleteByValue(v: V): boolean {
    const s = this.get(v.name);
    return s && s.delete(v) && s.size === 0 ? this.delete(v.name) : false;
  }
}

export function setAll<K, V>(
  map: Map<K, V>,
  newEntries: Iterable<[K, V]>,
): void {
  for (const [k, v] of newEntries) map.set(k, v);
}
