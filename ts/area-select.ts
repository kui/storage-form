import { SerialTaskExecutor, repeatAsPolling } from "./promises.js";
import { StorageBinder } from "./storage-binder.js";
import { listHandlers } from "./area-handler.js";
import { remove } from "./arrays.js";
import type {
  DOMBinderIO,
  ValueChange,
  ValueChanges,
  WroteValues,
} from "./storage-binder.js";

interface AreaSelectMixin extends HTMLSelectElement {
  area: string;
  target: AreaMixin | null;
}

class AreaSelectIO implements DOMBinderIO {
  private value: string;
  private observer: MutationObserver | null = null;
  private readonly areaChangeListeners: ((change: ValueChange) => void)[];
  private readonly valueChangeListeners: ((
    change: ValueChanges,
  ) => void | Promise<void>)[] = [];
  private polling: { stop(): Promise<void> } | null = null;

  constructor(private readonly baseElement: AreaSelectMixin) {
    this.value = baseElement.value;
    this.areaChangeListeners = [
      (change) => {
        this.baseElement.area = change.newValue ?? "";
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
        if (r.attributeName === "area") {
          this.updateArea(r.oldValue ?? undefined, this.baseElement.area);
        }
      }
    });
    this.observer.observe(this.baseElement, {
      attributes: true,
      attributeFilter: ["area"],
    });
  }

  private startValuePolling() {
    this.polling = repeatAsPolling(async () => {
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

  private updateArea(
    oldValue: string | undefined,
    newValue: string | undefined,
  ) {
    for (const l of this.areaChangeListeners) l({ oldValue, newValue });
  }

  getArea(): string | null {
    return this.baseElement.area;
  }

  onAreaChange(callback: (changes: ValueChange) => void): { stop: () => void } {
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

  clear() {
    this.baseElement.value = this.baseElement.getAttribute("value") ?? "";
  }
}

interface AreaMixin extends HTMLElement {
  area: string;
}

type HTMLSelectElementConstructor<
  T extends HTMLSelectElement = HTMLSelectElement,
> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]) => T;

export function mixinAreaSelect<T extends HTMLSelectElementConstructor>(
  base: T,
): T & HTMLSelectElementConstructor<AreaSelectMixin> {
  return class extends base {
    private binder: StorageBinder | null = null;
    private io: AreaSelectIO | null = null;
    private readonly areaOptions = new Map<string, HTMLOptionElement>();
    private readonly taskExecutor = new SerialTaskExecutor();

    get area(): string {
      return this.getAttribute("area") ?? "";
    }
    set area(v: string) {
      this.setAttribute("area", v);
    }

    get target(): AreaMixin | null {
      let ancestor: HTMLElement | null = this.parentElement;
      while (ancestor) {
        if (
          ancestor instanceof HTMLElement &&
          typeof (ancestor as AreaMixin).area === "string"
        )
          return ancestor as AreaMixin;
        ancestor = ancestor.parentElement;
      }
      return null;
    }

    connectedCallback() {
      this.taskExecutor.enqueueNoWait(async () => {
        if (this.options.length === 0) this.addAllHandlers();
        this.io = new AreaSelectIO(this);
        this.binder = new StorageBinder(this.io);
        await this.binder.start();
        this.io.startBinding();
      });
    }

    private addAllHandlers() {
      for (const [area] of listHandlers()) {
        if (this.areaOptions.has(area)) continue;
        const o = document.createElement("option");
        o.value = area;
        o.innerHTML = area;
        this.appendChild(o);
        this.areaOptions.set(area, o);
      }
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

export class HTMLAreaSelectElement extends mixinAreaSelect(HTMLSelectElement) {
  static register() {
    register();
  }
}

export function register() {
  customElements.define("area-select", HTMLAreaSelectElement, {
    extends: "select",
  });
}
