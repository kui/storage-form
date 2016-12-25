export default class WebStorageAreaHandler {
  storage: Storage;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  read(name: string): Promise<?string> {
    return Promise.resolve(this.storage.getItem(name));
  }

  write(name: string, newValue: string): Promise<void> {
    this.storage.setItem(name, newValue);
    return Promise.resolve();
  }

  removeItem(name: string): Promise<void> {
    this.storage.removeItem(name);
    return Promise.resolve();
  }
}






