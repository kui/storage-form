export interface ValueChange {
  oldValue?: string;
  newValue?: string;
}
export type ValueChanges = Map<string, ValueChange>;
export type StoredValues = Map<string, string>;
export type WroteValues = Map<string, string | undefined>;

export class UpdateEventListenerCollection {
  private listeners: ((updates: WroteValues) => void | Promise<void>)[] = [];

  addEventListener(listener: (updates: WroteValues) => void | Promise<void>): {
    stop: () => boolean;
  } {
    this.listeners.push(listener);
    return { stop: () => this.removeEventListener(listener) };
  }
  removeEventListener(
    listener: (updates: WroteValues) => void | Promise<void>,
  ): boolean {
    const index = this.listeners.indexOf(listener);
    this.listeners = this.listeners.filter((l) => l !== listener);
    return index >= 0;
  }
  dispatchEvent(updates: WroteValues) {
    return Promise.all(this.listeners.map((l) => l(updates)));
  }
}

declare global {
  // eslint-disable-next-line no-var
  var storageForm: {
    updateEventListeners: Map<unknown, UpdateEventListenerCollection>;
  };
}

if (typeof globalThis.storageForm === "undefined") {
  globalThis.storageForm = {
    updateEventListeners: new Map(),
  };
}

export const allCustomElementsDefinedEvent = {
  listeners: [] as (() => void)[],
  dispatchEvent() {
    for (const l of allCustomElementsDefinedEvent.listeners) l();
  },
};
