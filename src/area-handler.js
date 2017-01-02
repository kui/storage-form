export type Area = string;

export interface AreaHandler {
  read(name: string): Promise<?string>;
  write(name: string, newValue: string): Promise<void>;
  remove(name: string): Promise<void>;
}

const handlers: { [area: Area]: AreaHandler } = {};

export function registerHandler(area: Area, handler: AreaHandler): void {
  if (handlers[area]) {
    throw Error(`Already registered handler for "${area}"`);
  }
  handlers[area] = handler;
}

export function findHandler(area: Area): ?AreaHandler {
  return handlers[area];
}

export class WebStorageAreaHandler {
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

  remove(name: string): Promise<void> {
    this.storage.removeItem(name);
    return Promise.resolve();
  }
}

export class ChromeStorageAreaHandler {
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

  remove(name: string): Promise<void> {
    return new Promise((resolve) => this.storage.remove(name, resolve));
  }
}
