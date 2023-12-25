import { remove } from "./arrays.js";
import { SerialTaskExecutor, repeatAsPolling } from "./promises.js";
import {
  ComponentChangeCallback,
  DOMBinderIO,
  StorageBinder,
  ValueChanges,
  WroteValues,
} from "./storage-binder.js";
import { StorageElementMixin } from "./storage-element.js";
import * as storageControlsHandler from "./storage-controls-handler.js";

interface ValueContainerElement extends HTMLElement {
  name: string;
  value: string;
}
type MonoStorageControlMixin = ValueContainerElement & StorageElementMixin;

class MonoStorageControlIO implements DOMBinderIO {
  private value: string | undefined;
  private observer: MutationObserver | null = null;
  private readonly componentChangeListeners: ComponentChangeCallback[] = [];
  private readonly valueChangeListeners: ((
    change: ValueChanges,
  ) => void | Promise<void>)[] = [];
  private polling: { stop(): Promise<void> } | null = null;

  constructor(private readonly baseElement: MonoStorageControlMixin) {
    this.value = baseElement.value;
  }

  private isDOMBinding() {
    return this.observer !== null;
  }

  startBinding() {
    if (this.isDOMBinding()) return;
    this.baseElement.value = this.value ?? "";
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
          this.dispatchComponentChange({
            area: {
              newValue: this.baseElement.storageArea,
              oldValue: r.oldValue ?? undefined,
            },
          });
        } else if (r.attributeName === "name") {
          this.dispatchComponentChange({});
        }
      }
    });
    this.observer.observe(this.baseElement, {
      attributes: true,
      attributeFilter: ["storage-area", "name"],
    });
  }

  private startValuePolling() {
    this.polling = repeatAsPolling(async () => {
      const diff = storageControlsHandler.diff(this.baseElement, this.value);
      if (diff.type === "nochange") return;
      const newValue = diff.type === "value" ? diff.value : undefined;
      const oldValue = this.value;
      this.value = newValue;
      const changes = new Map([
        [this.baseElement.name, { oldValue, newValue }],
      ]);
      for (const l of this.valueChangeListeners)
        await l(changes)?.catch(console.error);
    });
  }

  private dispatchComponentChange(
    changes: Parameters<ComponentChangeCallback>[0],
  ) {
    for (const l of this.componentChangeListeners) l(changes);
  }

  getArea(): string | null {
    return this.baseElement.storageArea;
  }

  onComponentChange(callback: ComponentChangeCallback): { stop: () => void } {
    this.componentChangeListeners.push(callback);
    return {
      stop: () => {
        remove(this.componentChangeListeners, callback);
      },
    };
  }

  write(items: WroteValues): void | Promise<void> {
    const value = items.get(this.baseElement.name);
    if (value === undefined) return;
    this.value = value;
    if (this.isDOMBinding())
      storageControlsHandler.write(this.baseElement, value);
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

  clear(): void {
    this.value = undefined;
    if (this.isDOMBinding())
      storageControlsHandler.reset(this.baseElement);
  }
}

type Constructor<E extends ValueContainerElement = ValueContainerElement> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]) => E;

export function mixinMonoStorageControl<T extends Constructor>(
  base: T,
): T & Constructor<MonoStorageControlMixin> {
  return class
    extends base
    implements MonoStorageControlMixin, ValueContainerElement
  {
    private binder: StorageBinder | null = null;
    private io: MonoStorageControlIO | null = null;
    private readonly taskExecutor = new SerialTaskExecutor();

    get storageArea(): string {
      return this.getAttribute("storage-area") ?? "";
    }
    set storageArea(v: string) {
      this.setAttribute("storage-area", v);
    }

    connectedCallback() {
      this.taskExecutor.enqueueNoWait(async () => {
        this.io = new MonoStorageControlIO(this);
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

export class HTMLStorageInputElement extends mixinMonoStorageControl(
  HTMLInputElement,
) {
  static register() {
    customElements.define("storage-input", HTMLStorageInputElement, {
      extends: "input",
    });
  }
}

export class HTMLStorageSelectElement extends mixinMonoStorageControl(
  HTMLSelectElement,
) {
  static register() {
    customElements.define("storage-select", HTMLStorageSelectElement, {
      extends: "select",
    });
  }
}

export class HTMLStorageTextAreaElement extends mixinMonoStorageControl(
  HTMLTextAreaElement,
) {
  static register() {
    customElements.define("storage-textarea", HTMLStorageTextAreaElement, {
      extends: "textarea",
    });
  }
}

export class HTMLStorageOutputElement extends mixinMonoStorageControl(
  HTMLOutputElement,
) {
  static register() {
    customElements.define("storage-output", HTMLStorageOutputElement, {
      extends: "output",
    });
  }
}
