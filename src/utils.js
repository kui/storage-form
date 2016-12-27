export function sleep(msec: number): Promise<void> {
  return new Promise((resolve) => {
    setInterval(() => resolve(), msec);
  });
}

export function dedup<T>(array: Array<T>, predicate?: (t: T, o: T) => boolean = (t, o) => t === o): Array<T> {
  return array.reduce((result: Array<T>, element) => {
    if (result.some((i) => predicate(i, element))) result;
    return result.concat(element);
  },[]);
}
