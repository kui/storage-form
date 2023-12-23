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
