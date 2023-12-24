import { remove } from "./arrays.js";
import { SerialTaskExecutor, repeatAsPolling } from "./promises.js";
import {
  DOMBinderIO,
  StorageBinder,
  ValueChange,
  ValueChanges,
  WroteValues,
} from "./storage-binder.js";
import { StorageElementMixin } from "./storage-element.js";

type StorageSelectMixin = HTMLSelectElement & StorageElementMixin;

class StorageSelectIO implements DOMBinderIO {
  private value: string;
  private observer: MutationObserver | null = null;
  private readonly areaChangeListeners: ((change: ValueChange) => void)[];
  private readonly valueChangeListeners: ((
    change: ValueChanges,
  ) => void | Promise<void>)[] = [];
  private polling: { stop(): Promise<void> } | null = null;

  constructor(private readonly baseElement: StorageSelectMixin) {
    this.value = baseElement.value;
    this.areaChangeListeners = [
      (change) => {
        this.baseElement.value = change.newValue ?? "";
      },
    ];
  }

  private isDOMBinding() {
    return this.observer !== null;
  }

  startBinding() {
    if (this.isDOMBinding()) return;
    this.baseElement.value = this.value;
    this.buildObserver();
    this.startValuePolling();
  }

  async stopBinding() {
    if (!this.isDOMBinding()) return;
    this.observer?.disconnect();
    this.observer = null;
    await this.polling?.stop();
  }

  private buildObserver() {
    this.observer = new MutationObserver((records) => {
      for (const r of records) {
        if (r.attributeName === "storage-area") {
          this.dispatchAreaChange(
            r.oldValue ?? undefined,
            this.baseElement.storageArea,
          );
        }
      }
    });
    this.observer.observe(this.baseElement, {
      attributes: true,
      attributeFilter: ["storage-area"],
    });
  }

  private startValuePolling() {
    this.polling = repeatAsPolling(async () => {
      if (this.baseElement.selectedIndex < 0) return;
      const newValue = this.baseElement.value;
      const oldValue = this.value;
      if (oldValue === newValue) return;
      this.value = newValue;
      const changes = new Map([
        [this.baseElement.name, { oldValue, newValue }],
      ]);
      for (const l of this.valueChangeListeners)
        await l(changes)?.catch(console.error);
    });
  }

  private dispatchAreaChange(
    oldValue: string | undefined,
    newValue: string | undefined,
  ) {
    for (const l of this.areaChangeListeners) l({ oldValue, newValue });
  }

  getArea(): string | null {
    return this.baseElement.storageArea;
  }

  onAreaChange(callback: (change: ValueChange) => void): { stop: () => void } {
    this.areaChangeListeners.push(callback);
    return {
      stop: () => {
        remove(this.areaChangeListeners, callback);
      },
    };
  }

  write(items: WroteValues): void | Promise<void> {
    const value = items.get(this.baseElement.name);
    if (value === undefined) return;
    this.value = value;
    if (this.isDOMBinding()) this.baseElement.value = value;
  }

  onChange(callback: (changes: ValueChanges) => void | Promise<void>): {
    stop: () => void;
  } {
    this.valueChangeListeners.push(callback);
    return {
      stop: () => {
        remove(this.valueChangeListeners, callback);
      },
    };
  }
}

type HTMLSelectElementConstructor<
  T extends HTMLSelectElement = HTMLSelectElement,
> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]) => T;

export function mixinAreaSelect<T extends HTMLSelectElementConstructor>(
  base: T,
): T & HTMLSelectElementConstructor<StorageSelectMixin> {
  return class extends base {
    private binder: StorageBinder | null = null;
    private io: StorageSelectIO | null = null;
    private readonly taskExecutor = new SerialTaskExecutor();

    get storageArea(): string {
      return this.getAttribute("storage-area") ?? "";
    }
    set storageArea(v: string) {
      this.setAttribute("storage-area", v);
    }

    connectedCallback() {
      this.taskExecutor.enqueueNoWait(async () => {
        this.io = new StorageSelectIO(this);
        this.binder = new StorageBinder(this.io);
        await this.binder.start();
        this.io.startBinding();
      });
    }

    disconnectedCallback() {
      this.taskExecutor.enqueueNoWait(async () => {
        await this.io?.stopBinding();
        this.io = null;
        this.binder?.stop();
        this.binder = null;
      });
    }
  };
}

export class HTMLStorageSelectElement extends mixinAreaSelect(HTMLSelectElement) {
  static register() {
    register();
  }
}

export function register() {
  customElements.define("storage-select", HTMLStorageSelectElement, {
    extends: "select",
  });
}
