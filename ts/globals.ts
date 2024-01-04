export interface StorageChange {
  key: string | null;
  oldValue: string | null;
  newValue: string | null;
  storageArea: Storage | null;
}

declare global {
  // eslint-disable-next-line no-var
  var storageForm: {
    webStorage: {
      storageEventListeners: ((change: StorageChange) => void)[];
      dispatchEvent(change: StorageChange): void;
    };
  };
}

if (typeof globalThis.storageForm === "undefined") {
  globalThis.storageForm = {
    webStorage: {
      storageEventListeners: [],
      dispatchEvent(change: StorageChange) {
        for (const l of storageForm.webStorage.storageEventListeners) l(change);
      },
    },
  };
}

export const allCustomElementsDefinedEvent = {
  listeners: [] as (() => void)[],
  dispatchEvent() {
    for (const l of allCustomElementsDefinedEvent.listeners) l();
  },
};
