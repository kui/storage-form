declare type ChromeStorageItems = { [key: string]: string };
declare class ChromeStorageListenee {
  addListener(callback: (changes: ChromeStorageItems, areaName: string) => void): void;
}
declare class ChromeStorageArea {
  onChanged: ChromeStorageListenee;
  getBytesInUse(callback: (bytesInUse: number) => void): void;
  getBytesInUse(keys: string, callback: (bytesInUse: number) => void): void;
  getBytesInUse(keys: string[], callback: (bytesInUse: number) => void): void;
  clear(callback?: () => void): void;
  set(items: ChromeStorageItems, callback?: () => void): void;
  remove(keys: string, callback?: () => void): void;
  remove(keys: string[], callback?: () => void): void;
  get(callback: (items: ChromeStorageItems) => void): void;
  get(keys: string, callback: (items: ChromeStorageItems) => void): void;
  get(keys: string[], callback: (items: ChromeStorageItems) => void): void;
}
declare class LocalChromeStorageArea extends ChromeStorageArea {
  QUOTA_BYTES: number;
}
declare class SyncChromeStorageArea extends ChromeStorageArea {
  QUOTA_BYTES_PER_ITEM: number;
  MAX_ITEMS: number;
  MAX_WRITE_OPERATIONS_PER_HOUR: number;
  MAX_WRITE_OPERATIONS_PER_MINUTE: number;
}
declare class ChromeStorage {
  local: LocalChromeStorageArea;
  sync: SyncChromeStorageArea;
}
declare var chrome: {
  storage: ChromeStorage;
}
