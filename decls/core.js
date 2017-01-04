declare class Object {
  static entries<K, V>(object: { [k: K]: V }): Array<[K, V]>;
}
