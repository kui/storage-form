import { mixinAreaHandlerElement } from "./area-handler-element.js";
import { distinctConcat } from "./arrays.js";
import {
  dispatchChangeEvent,
  type HTMLElementConstructor,
  type StorageElementMixin,
  type StorageFormLikeElement,
} from "./elements.js";
import { WroteValues } from "./globals.js";
import { mapValues, NamedSetMap, setAll } from "./maps.js";
import * as storageControlsHandler from "./storage-controls-handler.js";

const STORAGE_CONTROL_TAGS = ["input", "select", "textarea", "output"] as const;
type HTMLStorageFormControlElement =
  HTMLElementTagNameMap[(typeof STORAGE_CONTROL_TAGS)[number]];
const STORAGE_CONTROL_SELECTOR = STORAGE_CONTROL_TAGS.join(",");

function matchesStorageControl(e: unknown): e is HTMLStorageFormControlElement {
  return (
    e instanceof Element &&
    // Child storage custom elements should be ignored
    !(e as Partial<StorageFormLikeElement>).isNotStorageControl &&
    e.hasAttribute("name") &&
    e.matches(STORAGE_CONTROL_SELECTOR)
  );
}

const notInitialized = Symbol("notInitialized");

class NamedStorageControlsCollection {
  private readonly elements = new Set<HTMLStorageFormControlElement>();
  readonly name: string;
  #value: string | undefined | typeof notInitialized = notInitialized;

  constructor(e: HTMLStorageFormControlElement) {
    this.name = e.name;
  }

  add(e: HTMLStorageFormControlElement) {
    if (e.name !== this.name) throw Error("Invalid name");
    this.elements.add(e);
    if (this.#value !== notInitialized) {
      storageControlsHandler.write(e, this.#value);
    }
    // Donot dispatch change event here because it is overwritten by the value
    return this;
  }

  delete(e: HTMLStorageFormControlElement) {
    return this.elements.delete(e);
  }

  get size(): number {
    return this.elements.size;
  }

  get value(): string | undefined | typeof notInitialized {
    return this.#value;
  }
  set value(newValue: string | undefined) {
    if (this.#value === newValue) return;
    this.#value = newValue;
    const chagedElements: HTMLStorageFormControlElement[] = [];
    for (const e of this.elements) {
      const isUpdated = storageControlsHandler.write(e, newValue);
      if (isUpdated) chagedElements.push(e);
    }
    if (chagedElements.length > 0) dispatchChangeEvent(...chagedElements);
  }

  diff() {
    if (this.#value === notInitialized) return "notInitialized";

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

    // There are 3 cases by the combination of unchecked and newvalue:
    // 1) unselected=any,   newvalue=string:    If the value was changed, It indicates to have a change.
    // 2) unselected=true,  newvalue=undefined: If an element was made unselected and the value was not changed, It indicates that the value was deleted.
    // 3) unselected=false, newvalue=undefined: If an element was not made unselected and the value was not changed, It indicates to have no changes.
    if (newValue === undefined && !unselected) return "nochange";
    return { oldValue, newValue };
  }

  [Symbol.iterator]() {
    return this.elements[Symbol.iterator]();
  }
}

export function mixinStorageForm<T extends HTMLElementConstructor<HTMLElement>>(
  base: T,
): T & HTMLElementConstructor<StorageElementMixin & StorageFormLikeElement> {
  return class extends mixinAreaHandlerElement(base) {
    readonly isNotStorageControl = true;

    private readonly namedControlMap = new NamedSetMap(
      (e: HTMLStorageFormControlElement) =>
        new NamedStorageControlsCollection(e),
    );
    private readonly mutationObserver = new MutationObserver(
      this.handleMutations.bind(this),
    );
    private readonly changeListener = (event: Event) => {
      if (matchesStorageControl(event.target))
        this.valueChangedCallback().catch(console.error);
    };

    connectedCallback() {
      this.initControls();
      super.connectedCallback?.();
      this.mutationObserver.observe(this, this.observerOptions);
      this.addEventListener("change", this.changeListener);
      this.addEventListener("input", this.changeListener);
    }

    private initControls() {
      this.namedControlMap.clear();
      for (const e of this.querySelectorAll(STORAGE_CONTROL_SELECTOR)) {
        if (matchesStorageControl(e)) this.namedControlMap.add(e);
      }
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
      this.mutationObserver.disconnect();
      this.removeEventListener("change", this.changeListener);
      this.removeEventListener("input", this.changeListener);
    }

    static readonly observedAttributes = distinctConcat(
      super.observedAttributes ?? [],
      ["storage-area"],
    );

    attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null,
    ) {
      super.attributeChangedCallback?.(name, oldValue, newValue);
      if (name === "storage-area") {
        this.invokeStorageChangeCallback();
      }
    }

    //

    override async storageChangeCallback(updates: WroteValues) {
      const newValues = new Map<string, string | undefined>();
      if (updates.size === 0) {
        const keys = [...this.namedControlMap.keys()];
        setAll(
          newValues,
          keys.map((n) => [n, undefined]),
        );
        setAll(newValues, await this.areaHandler.read(keys));
      } else {
        setAll(
          newValues,
          mapValues(updates, (_, v) => v),
        );
      }

      for (const [name, elementSet] of this.namedControlMap) {
        if (newValues.has(name)) elementSet.value = newValues.get(name);
      }
    }

    //

    private readonly observerOptions = {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["name"],
      attributeOldValue: true,
    };

    private handleMutations(mutations: MutationRecord[]) {
      let shouldDispatch = false;
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          for (const e of mutation.addedNodes) {
            if (matchesStorageControl(e)) this.namedControlMap.add(e);
          }
          for (const e of mutation.removedNodes) {
            if (matchesStorageControl(e)) this.namedControlMap.deleteByValue(e);
          }
          shouldDispatch = true;
        } else if (mutation.attributeName === "name") {
          if (!matchesStorageControl(mutation.target)) continue;
          const oldName = mutation.oldValue;
          this.namedControlMap.deleteByKeyValue(oldName ?? "", mutation.target);
          this.namedControlMap.add(mutation.target);
          shouldDispatch = true;
        }
      }
      if (shouldDispatch) this.invokeStorageChangeCallback();
    }

    private async valueChangedCallback(): Promise<void> {
      const entries: WroteValues = new Map();
      for (const [name, elementSet] of this.namedControlMap) {
        const diff = elementSet.diff();
        if (diff === "nochange" || diff === "notInitialized") continue;
        entries.set(name, diff.newValue);
      }
      if (entries.size > 0) await this.areaHandler.write(entries);
    }
  };
}

export class HTMLStorageFormElement extends mixinStorageForm(HTMLElement) {
  static register() {
    customElements.define("storage-form", HTMLStorageFormElement);
  }
}
