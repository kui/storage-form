export default class ChromeStorageAreaHandler {
  storage: ChromeStorageArea;

  constructor(storage: ChromeStorageArea) {
    this.storage = storage;
  }

  read(name: string): Promise<?string> {
    return new Promise((resolve) => this.storage.get(name, (v) => resolve(v[name])));
  }

  write(name: string, newValue: string): Promise<void> {
    return new Promise((resolve) => this.storage.set({ [name]: newValue }, resolve));
  }

  removeItem(name: string): Promise<void> {
    return new Promise((resolve) => this.storage.remove(name, resolve));
  }
}
