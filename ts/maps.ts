import { remove } from "./arrays.js";

class MultiValueMap<K, V, VV extends Iterable<V>> extends Map<K, VV> {
  *flattenValues() {
    for (const arr of this.values()) yield* arr;
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
  deleteByKey(key: K, value: V): boolean {
    const a = this.get(key);
    return a && remove(a, value) && a.length === 0 ? this.delete(key) : false;
  }
}

export class SetValueMap<K, V> extends MultiValueMap<K, V, Set<V>> {
  add(key: K, value: V) {
    let s = this.get(key);
    if (!s) {
      s = new Set();
      this.set(key, s);
    }
    s.add(value);
    return this;
  }

  deleteByKey(key: K, value: V): boolean {
    const s = this.get(key);
    return s && s.delete(value) && s.size === 0 ? this.delete(key) : false;
  }
}

export function setAll<K, V>(
  map: Map<K, V>,
  newEntries: Iterable<[K, V]>,
): void {
  for (const [k, v] of newEntries) map.set(k, v);
}
