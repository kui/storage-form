/**
 * Removes the first occurrence of a specific object from an array.
 * @param array The array to remove the item from.
 * @param item The item to remove.
 * @returns `true` if the item was removed, `false` otherwise.
 */
export function remove<T>(array: T[], item: T): boolean {
  const index = array.indexOf(item);
  if (index < 0) return false;
  array.splice(index, 1);
  return true;
}

export function buildWithIndex<T>(
  length: number,
  builder: (i: number) => T,
): T[] {
  const arr = new Array<T>(length);
  for (let i = 0; i < length; i++) arr[i] = builder(i);
  return arr;
}

function* distinct<T>(iter: Iterable<T>): Generator<T> {
  const set = new Set<T>();
  for (const item of iter) {
    if (set.has(item)) continue;
    set.add(item);
    yield item;
  }
}

function* flatten<T>(iter: Iterable<Iterable<T>>): Generator<T> {
  for (const subIter of iter) for (const item of subIter) yield item;
}

export function distinctConcat<T>(...arrays: T[][]): T[] {
  return [...distinct(flatten<T>(arrays))];
}
