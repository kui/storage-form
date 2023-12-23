import { remove } from "./arrays.js";
import { SetValueMap } from "./maps.js";
import { SerialTaskExecutor, repeatAsPolling } from "./promises.js";
import { StorageBinder } from "./storage-binder.js";
import type {
  DOMBinderIO,
  ValueChange,
  ValueChanges,
  WroteValues,
} from "./storage-binder.js";

const STORAGE_CONTROL_TAGS = ["input", "select", "textarea", "output"] as const;
type HTMLStorageFormControllElements =
  HTMLElementTagNameMap[(typeof STORAGE_CONTROL_TAGS)[number]];
const STORAGE_CONTROL_SELECTOR = STORAGE_CONTROL_TAGS.join(",");

function matchesStorageControl(
  e: unknown,
): e is HTMLStorageFormControllElements {
  return e instanceof Element && e.matches(STORAGE_CONTROL_SELECTOR);
}

interface StorageFormMixin extends HTMLElement {
  area: string;
}

class StorageFormIO implements DOMBinderIO {
  private values = new Map<string, string>();
  private readonly elements = new SetValueMap<
    string,
    HTMLStorageFormControllElements
  >();
  private readonly changeListeners: ((
    changes: ValueChanges,
  ) => void | Promise<void>)[] = [];
  private observer: MutationObserver | null = null;
  private polling: { stop(): Promise<void> } | null = null;
  private readonly areaChangeListeners: ((change: ValueChange) => void)[] = [];

  constructor(private readonly baseElement: StorageFormMixin) {}

  getArea(): string {
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

  private isDOMBinding() {
    return this.observer !== null;
  }

  startBinding() {
    if (this.isDOMBinding()) throw Error("Already started");
    this.initElements();
    this.buildObserver();
    this.startValuePolling();
  }

  async stopBinding() {
    if (!this.isDOMBinding()) return;
    this.observer?.disconnect();
    this.observer = null;
    await this.polling?.stop();
  }

  private initElements() {
    this.elements.clear();
    const elements =
      this.baseElement.querySelectorAll<HTMLStorageFormControllElements>(
        STORAGE_CONTROL_SELECTOR,
      );
    for (const e of elements) {
      const name = e.name;
      if (!name) continue;
      this.elements.add(name, e);
    }
  }

  private buildObserver() {
    this.observer = new MutationObserver((records) => {
      let isChanged = false;
      for (const r of records) {
        if (r.type === "childList") {
          for (const e of r.addedNodes) {
            if (!matchesStorageControl(e)) continue;
            isChanged = true;
            const name = e.name;
            if (name) this.elements.add(name, e);
          }
          for (const e of r.removedNodes) {
            if (!matchesStorageControl(e)) continue;
            isChanged = true;
            const name = e.name;
            if (name) this.elements.deleteByKey(name, e);
          }
        } else if (r.type === "attributes" && r.attributeName === "name") {
          if (!matchesStorageControl(r.target)) continue;
          isChanged = true;
          const oldName = r.oldValue;
          if (oldName) this.elements.deleteByKey(oldName, r.target);
          const newName = r.target.name;
          if (newName) this.elements.add(newName, r.target);
        } else if (r.type === "attributes" && r.attributeName === "area") {
          const oldValue = r.oldValue ?? undefined;
          const newValue = this.baseElement.area;
          if (oldValue !== newValue)
            for (const l of this.areaChangeListeners) l({ oldValue, newValue });
        }
      }
      if (isChanged) {
        this.writeToDOM(this.values);
      }
    });
    this.observer.observe(this.baseElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["name", "area"],
      attributeOldValue: true,
    });
  }

  // We should not use EventListener of "input"/"change" or MutationObserver of the "value" attribute,
  // because they are not fired when the value is changed programmatically.
  private startValuePolling() {
    this.polling = repeatAsPolling(async () => {
      const changes = this.updateValues();
      if (changes.size > 0) await this.dispatchChangeListeners(changes);
    });
  }

  private async dispatchChangeListeners(changes: ValueChanges) {
    for (const l of this.changeListeners) await l(changes);
  }

  private updateValues(): ValueChanges {
    const changes = new Map<string, ValueChange>();
    for (const e of this.elements.flattenValues()) {
      if (
        e instanceof HTMLInputElement &&
        (e.type === "checkbox" || e.type === "radio") &&
        !e.checked
      )
        continue;
      const oldValue = this.values.get(e.name);
      const newValue = e.value;
      if (newValue === oldValue) continue;
      const change: ValueChange = { newValue };
      if (this.values.has(e.name)) change.oldValue = oldValue;
      if (changes.has(e.name))
        console.warn("Ignore change: element=%o, name=%s, change=%o", e, e.name, change);
      else changes.set(e.name, change);
      this.values.set(e.name, newValue);
    }
    return changes;
  }

  write(items: WroteValues) {
    for (const [name, value] of items) {
      if (value === undefined) this.values.delete(name);
      else this.values.set(name, value);
    }
    if (this.isDOMBinding()) this.writeToDOM(items);
  }

  private writeToDOM(items: WroteValues) {
    for (const [name, value] of items) {
      const elements = this.elements.get(name);
      if (!elements) continue;
      for (const e of elements) {
        if (
          e instanceof HTMLInputElement &&
          (e.type === "checkbox" || e.type === "radio")
        ) {
          e.checked = e.value === value;
        } else if (value !== undefined) {
          e.value = value;
        }
      }
    }
  }

  onChange(callback: (changes: ValueChanges) => void | Promise<void>): {
    stop: () => void;
  } {
    this.changeListeners.push(callback);
    return {
      stop: () => {
        remove(this.changeListeners, callback);
      },
    };
  }
}

type HTMLElementConstructor<T extends HTMLElement = HTMLElement> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]) => T;

export function mixinStorage<T extends HTMLElementConstructor>(
  base: T,
): T & HTMLElementConstructor<StorageFormMixin> {
  return class extends base {
    private binder: StorageBinder | null = null;
    private io: StorageFormIO | null = null;
    private readonly taskExecutor = new SerialTaskExecutor();

    get area(): string {
      return this.getAttribute("area") ?? "";
    }
    set area(v: string) {
      this.setAttribute("area", v);
    }

    connectedCallback() {
      this.taskExecutor.enqueueNoWait(async () => {
        this.io = new StorageFormIO(this);
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

export class HTMLStorageFormElement extends mixinStorage(HTMLElement) {
  static register() {
    register();
  }
}

export function register() {
  customElements.define("storage-form", HTMLStorageFormElement);
}
