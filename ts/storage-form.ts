import { remove } from "./arrays.js";
import { NamedSetMap } from "./maps.js";
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
  private readonly elements = new NamedSetMap<
    SameNameElementSet,
    HTMLStorageFormControllElements
  >(SameNameElementSet);
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
    for (const e of elements) if (e.name) this.elements.add(e);
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
            if (e.name) this.elements.add(e);
          }
          for (const e of r.removedNodes) {
            if (!matchesStorageControl(e)) continue;
            isValueChanged = true;
            this.elements.deleteByValue(e);
          }
        } else if (r.type === "attributes" && r.attributeName === "name") {
          if (!matchesStorageControl(r.target)) continue;
          isValueChanged = true;
          const oldName = r.oldValue;
          if (oldName) this.elements.deleteByValue(r.target);
          const newName = r.target.name;
          if (newName) this.elements.add(r.target);
        } else if (r.type === "attributes" && r.attributeName === "area") {
          const oldValue = r.oldValue ?? undefined;
          const newValue = this.baseElement.area;
          if (oldValue !== newValue)
            for (const l of this.areaChangeListeners) l({ oldValue, newValue });
        }
      }
      if (isValueChanged) {
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
    for (const e of this.elements) {
      if (e instanceof HTMLInputElement) {
        if (
          e.type === "button" ||
          e.type === "reset" ||
          e.type === "submit" ||
          e.type === "image" ||
          e.type === "hidden"
        ) {
          // Do nothing
          // Should not set the value of these types of <input> element.
        } else if (e.type === "checkbox" || e.type === "radio") {
          e.checked = e.value === newValue;
        } else if (e.type === "color") {
          if (newValue?.match(/^#[0-9a-f]{6}$/i)) {
            e.value = newValue;
          } else {
            e.value = "#000000";
          }
        } else if (e.type === "date") {
          if (newValue?.match(/^\d{4}-\d{2}-\d{2}$/)) {
            e.value = newValue;
          } else {
            e.value = "";
          }
        } else if (e.type === "datetime-local") {
          if (newValue?.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
            e.value = newValue;
          } else {
            e.value = "";
          }
        } else if (e.type === "file") {
          if (e.value !== newValue) e.value = "";
        } else if (e.type === "month") {
          if (newValue?.match(/^\d{4}-\d{2}$/)) {
            e.value = newValue;
          } else {
            e.value = "";
          }
        } else if (e.type === "number" || e.type === "range") {
          if (newValue?.match(/^[-+]?\d+(\.\d+)?$/)) {
            e.value = newValue;
          } else {
            e.value = "";
          }
        } else if (
          e.type === "password" ||
          e.type === "text" ||
          e.type === "search" ||
          e.type === "tel" ||
          e.type === "url" ||
          e.type === "email"
        ) {
          e.value = newValue ?? "";
        } else if (e.type === "time") {
          if (newValue?.match(/^\d{2}:\d{2}$/)) {
            e.value = newValue;
          } else {
            e.value = "";
          }
        } else if (e.type === "week") {
          if (newValue?.match(/^\d{4}-W\d{2}$/)) {
            e.value = newValue;
          } else {
            e.value = "";
          }
        } else {
          console.warn("Unexpected element type: %o", e);
        }
      } else if (
        e instanceof HTMLSelectElement ||
        e instanceof HTMLTextAreaElement ||
        e instanceof HTMLOutputElement
      ) {
        e.value = newValue ?? "";
      } else {
        console.warn("Unexpected element type: %o", e);
      }
    }
  }

  /**
   * @returns undefined if no changes, otherwise ValueChange
   */
  update(): ValueChange | undefined {
    const oldValue = this.#value;
    let newValue: string | undefined = undefined;
    let unselected = false;
    for (const e of this.elements) {
      if (e instanceof HTMLInputElement) {
        if (e.type === "checkbox" || e.type === "radio") {
          if (e.checked) {
            // e is a checkable element
            if (oldValue === e.value) continue;
            newValue = e.value;
            break;
          } else if (oldValue === e.value) {
            unselected = true;
            // Do not break here, because we should check other elements.
            // break;
          }
        } else if (
          e.type === "date" ||
          e.type === "datetime-local" ||
          e.type === "file" ||
          e.type === "time" ||
          e.type === "week" ||
          e.type === "month"
        ) {
          // Should not read the value of these types when the value is empty.
          if (e.value !== "") {
            if (oldValue === e.value) continue;
            newValue = e.value;
            break;
          }
        } else if (e.type === "email" || e.type === "tel" || e.type === "url") {
          // Should not read the value of these types looks like type=text when the value is invalid.
          if (e.validity.valid) {
            if (oldValue === e.value) continue;
            newValue = e.value;
            break;
          }
        } else if (
          e.type === "hidden" ||
          e.type === "image" ||
          e.type === "reset" ||
          e.type === "submit" ||
          e.type === "button"
        ) {
          // Do nothing
          // Should not read the value of these types of <input> element.
        } else if (e.type === "color" || e.type === "range") {
          // TODO Should not read the value when the value is not set by the user.
          // But there might be no way to detect it.
          if (oldValue === e.value) continue;
          newValue = e.value;
          break;
        } else if (
          e.type === "number" ||
          e.type === "password" ||
          e.type === "text" ||
          e.type === "search"
        ) {
          if (oldValue === e.value) continue;
          newValue = e.value;
          break;
        } else {
          console.warn("Unexpected element type: %o", e);
        }
      } else if (e instanceof HTMLSelectElement) {
        // Should not read the value when no option is selected.
        if (e.selectedIndex >= 0) {
          if (oldValue === e.value) continue;
          newValue = e.value;
          break;
        }
      } else if (
        e instanceof HTMLTextAreaElement ||
        e instanceof HTMLOutputElement
      ) {
        if (oldValue === e.value) continue;
        newValue = e.value;
        break;
      } else {
        console.warn("Unexpected element type: %o", e);
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
