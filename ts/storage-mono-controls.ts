import * as storageControlsHandler from "./storage-controls-handler.js";
import { remove } from "./arrays.js";
import {
  addChangeListeners,
  dispatchChangeEvent,
  updateValue,
} from "./elements.js";
import { SerialTaskExecutor } from "./promises.js";
import {
  ComponentChangeCallback,
  DOMBinderIO,
  StorageBinder,
  ValueChanges,
  WroteValues,
} from "./storage-binder.js";
import type { StorageElementMixin } from "./elements.js";

interface MonoStorageControlParent extends HTMLElement {
  name: string;
  value: string;
}
export type MonoStorageControlMixin = MonoStorageControlParent &
  StorageElementMixin;

class MonoStorageControlIO implements DOMBinderIO {
  private value: string | undefined;
  private readonly mutationObserver: MutationObserver;
  private readonly componentChangeListeners: ComponentChangeCallback[] = [];
  private readonly valueChangeListeners: ((
    change: ValueChanges,
  ) => void | Promise<void>)[] = [];
  private listening: { stop(): void } | null = null;

  constructor(private readonly baseElement: MonoStorageControlMixin) {
    this.value = baseElement.value;
    this.mutationObserver = new MutationObserver(
      this.handleMutaions.bind(this),
    );
  }

  private isDOMBinding() {
    return this.listening !== null;
  }

  startBinding() {
    if (this.isDOMBinding()) return;
    updateValue(this.baseElement, this.value ?? "");
    this.startMutationObserver();
    this.listening = addChangeListeners(
      this.baseElement,
      this.handleChangeEvent.bind(this),
    );
  }

  stopBinding() {
    if (!this.isDOMBinding()) return;
    this.mutationObserver.disconnect();
    this.listening?.stop();
  }

  private startMutationObserver() {
    this.mutationObserver.observe(this.baseElement, {
      attributes: true,
      attributeFilter: ["storage-area", "name"],
    });
  }

  private async handleChangeEvent() {
    const diff = storageControlsHandler.diff(this.baseElement, this.value);
    if (diff.type === "nochange") return;
    const newValue = diff.type === "value" ? diff.value : undefined;
    const oldValue = this.value;
    this.value = newValue;
    const changes = new Map([[this.baseElement.name, { oldValue, newValue }]]);
    for (const l of this.valueChangeListeners) await l(changes);
  }

  private handleMutaions(mutations: MutationRecord[]) {
    let area: string | undefined = undefined;
    let shouldDispatch = false;
    for (const r of mutations) {
      if (r.attributeName === "storage-area") {
        area = this.getArea() ?? undefined;
        shouldDispatch = true;
      } else if (r.attributeName === "name") {
        shouldDispatch = true;
      }
    }
    if (shouldDispatch) {
      this.dispatchComponentChange(area);
    }
  }

  private dispatchComponentChange(area?: string | undefined) {
    const e = { area, names: this.getNames() };
    for (const l of this.componentChangeListeners) l(e);
  }

  getArea(): string | null {
    return this.baseElement.storageArea;
  }

  getNames(): string[] {
    return [this.baseElement.name];
  }

  onComponentChange(callback: ComponentChangeCallback): { stop: () => void } {
    this.componentChangeListeners.push(callback);
    return {
      stop: () => {
        remove(this.componentChangeListeners, callback);
      },
    };
  }

  write(items: WroteValues) {
    if (!items.has(this.baseElement.name)) return;
    const value = items.get(this.baseElement.name);
    this.value = value;
    if (this.isDOMBinding()) {
      const changed = storageControlsHandler.write(this.baseElement, value);
      if (changed) dispatchChangeEvent(this.baseElement);
    }
  }

  clearWrite(items: WroteValues) {
    const clearedMap = new Map<string, string | undefined>();
    clearedMap.set(this.baseElement.name, items.get(this.baseElement.name));
    this.write(items);
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
    if (this.isDOMBinding()) {
      storageControlsHandler.reset(this.baseElement);
    }
  }
}

type Constructor<
  E extends MonoStorageControlParent = MonoStorageControlParent,
> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]) => E;

export function mixinMonoStorageControl<T extends Constructor>(
  base: T,
): T & Constructor<MonoStorageControlMixin> {
  return class
    extends base
    implements MonoStorageControlMixin, MonoStorageControlParent
  {
    private binder: StorageBinder | null = null;
    private io: MonoStorageControlIO | null = null;
    private readonly taskExecutor = new SerialTaskExecutor();
    readonly isNotStorageControl = true;

    get storageArea(): string {
      return this.getAttribute("storage-area") ?? "";
    }
    set storageArea(v: string) {
      this.setAttribute("storage-area", v);
    }

    connectedCallback() {
      super.connectedCallback?.();
      this.taskExecutor.enqueueNoWait(async () => {
        this.io = new MonoStorageControlIO(this);
        this.binder = new StorageBinder(this.io);
        await this.binder.start();
        this.io.startBinding();
      });
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
      this.taskExecutor.enqueueNoWait(() => {
        this.io?.stopBinding();
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
