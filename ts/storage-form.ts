import { remove } from "./arrays.js";
import { NamedSetMap } from "./maps.js";
import { SerialTaskExecutor, repeatAsPolling } from "./promises.js";
import { StorageBinder } from "./storage-binder.js";
import type {
  ComponentChangeCallback,
  DOMBinderIO,
  ValueChange,
  ValueChanges,
  WroteValues,
} from "./storage-binder.js";
import * as storageControlsHandler from "./storage-controls-handler.js";
import type { StorageElementMixin } from "./storage-element.js";

const STORAGE_CONTROL_TAGS = ["input", "select", "textarea", "output"] as const;
type HTMLStorageFormControllElements =
  HTMLElementTagNameMap[(typeof STORAGE_CONTROL_TAGS)[number]];
const STORAGE_CONTROL_SELECTOR = STORAGE_CONTROL_TAGS.join(",");

function matchesStorageControl(
  e: unknown,
): e is HTMLStorageFormControllElements {
  return (
    e instanceof Element &&
    // Child storage custom elements should be ignored
    !("storageArea" in e) &&
    "name" in e &&
    // Reject if the name is empty
    Boolean(e.name) &&
    e.matches(STORAGE_CONTROL_SELECTOR)
  );
}

class StorageFormIO implements DOMBinderIO {
  private values = new Map<string, string>();
  private readonly elements = new NamedSetMap<
    SameNameElementSet,
    HTMLStorageFormControllElements
  >(SameNameElementSet);
  private readonly changeListeners: ((
    changes: ValueChanges,
  ) => void | Promise<void>)[] = [];
  private observer: MutationObserver | null = null;
  private polling: { stop(): Promise<void> } | null = null;
  private readonly componentChangeListener: ComponentChangeCallback[] = [];

  constructor(private readonly baseElement: StorageElementMixin) {}

  getArea(): string {
    return this.baseElement.storageArea;
  }

  onComponentChange(callback: ComponentChangeCallback): {
    stop: () => void;
  } {
    this.componentChangeListener.push(callback);
    return {
      stop: () => {
        remove(this.componentChangeListener, callback);
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
    for (const e of elements)
      if (matchesStorageControl(e)) this.elements.add(e);
    this.writeToDOM(this.values);
  }

  private buildObserver() {
    this.observer = new MutationObserver((records) => {
      let isValueChanged = false;
      for (const r of records) {
        if (r.type === "childList") {
          for (const e of r.addedNodes) {
            if (!matchesStorageControl(e)) continue;
            isValueChanged = true;
            this.elements.add(e);
          }
          for (const e of r.removedNodes) {
            if (!matchesStorageControl(e)) continue;
            isValueChanged = true;
            this.elements.deleteByValue(e);
          }
        } else if (r.attributeName === "name") {
          if (!matchesStorageControl(r.target)) continue;
          const oldName = r.oldValue;
          if (oldName) this.elements.deleteByKeyValue(oldName, r.target);
          const newName = r.target.name;
          if (newName) this.elements.add(r.target);
          this.dispatchComponentChangeListeners({});
        } else if (r.attributeName === "storage-area") {
          const oldValue = r.oldValue ?? undefined;
          const newValue = this.baseElement.storageArea;
          if (oldValue !== newValue)
            this.dispatchComponentChangeListeners({
              area: { oldValue, newValue },
            });
        }
      }
      if (isValueChanged) this.writeToDOM(this.values);
    });
    this.observer.observe(this.baseElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["name", "storage-area"],
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
  private dispatchComponentChangeListeners(
    changes: Parameters<ComponentChangeCallback>[0],
  ) {
    for (const l of this.componentChangeListener) l(changes);
  }

  private updateValues(): ValueChanges {
    const changes = new Map<string, ValueChange>();
    for (const elementSet of this.elements.values()) {
      const change = elementSet.update();
      if (!change) continue;
      changes.set(elementSet.name, change);
      if (change.newValue === undefined) this.values.delete(elementSet.name);
      else this.values.set(elementSet.name, change.newValue);
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
      const elementSet = this.elements.get(name);
      if (elementSet) elementSet.value = value;
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

  clear(): void {
    this.values.clear();
    if (this.isDOMBinding())
      for (const elementSet of this.elements.values()) elementSet.clear();
  }
}

class SameNameElementSet {
  private readonly elements = new Set<HTMLStorageFormControllElements>();

  #name: string | undefined = undefined;
  #value: string | undefined = undefined;

  add(e: HTMLStorageFormControllElements) {
    this.elements.add(e);
    return this;
  }

  delete(e: HTMLStorageFormControllElements) {
    return this.elements.delete(e);
  }

  get size(): number {
    return this.elements.size;
  }

  get name(): string {
    if (this.#name !== undefined) return this.#name;
    for (const e of this.elements) {
      const name = e.name;
      if (name) return (this.#name = name);
    }
    throw Error("No element has name");
  }

  set value(newValue: string | undefined) {
    if (this.#value === newValue) return;
    this.#value = newValue;
    for (const e of this.elements) storageControlsHandler.write(e, newValue);
  }

  /**
   * @returns undefined if no changes, otherwise ValueChange
   */
  update(): ValueChange | undefined {
    const oldValue = this.#value;
    let newValue: string | undefined = undefined;
    let unselected = false;
    for (const e of this.elements) {
      const change = storageControlsHandler.diff(e, oldValue);
      if (change.type === "unselected") {
        unselected = true;
      } else if (change.type === "value") {
        newValue = change.value;
        break;
      }
    }

    // There are 4 cases by the combination of unchecked and newvalue:
    // 1) unselected=true,  newvalue=string:    If an element was made unselected and the value was changed, It indicates to have a change.
    // 2) unselected=true,  newvalue=undefined: If an element was made unselected and the value was not changed, It indicates that the value was deleted.
    // 3) unselected=false, newvalue=string:    If an element was not made unselected and the value was changed, It indicates to have a change.
    // 4) unselected=false, newvalue=undefined: If an element was not made unselected and the value was not changed, It indicates to have no changes.
    if (newValue === undefined && !unselected) return undefined;
    this.value = newValue;
    return { oldValue, newValue };
  }

  clear() {
    this.value = undefined;
  }
}

type HTMLElementConstructor<T extends HTMLElement = HTMLElement> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]) => T;

export function mixinStorage<T extends HTMLElementConstructor>(
  base: T,
): T & HTMLElementConstructor<StorageElementMixin> {
  return class extends base {
    private binder: StorageBinder | null = null;
    private io: StorageFormIO | null = null;
    private readonly taskExecutor = new SerialTaskExecutor();

    get storageArea(): string {
      return this.getAttribute("storage-area") ?? "";
    }
    set storageArea(v: string) {
      this.setAttribute("storage-area", v);
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