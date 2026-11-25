import { mixinAreaHandlerElement } from "./area-handler-element.js";
import { distinctConcat } from "./arrays.js";
import {
  dispatchChangeEvent,
  type HTMLElementConstructor,
  type StorageElementMixin,
  type StorageFormLikeElement,
} from "./elements.js";
import { WroteValues } from "./globals.js";
import { NamedSetMap } from "./maps.js";
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
  /** The last control edited before the value is initialized. */
  private edited: HTMLStorageFormControlElement | undefined;

  constructor(e: HTMLStorageFormControlElement) {
    this.name = e.name;
  }

  add(e: HTMLStorageFormControlElement) {
    if (e.name !== this.name) throw Error("Invalid name");
    if (this.elements.has(e)) return this;
    this.elements.add(e);
    if (this.#value !== notInitialized) {
      storageControlsHandler.write(e, this.#value);
    }
    // Donot dispatch change event here because it is overwritten by the value
    return this;
  }

  delete(e: HTMLStorageFormControlElement) {
    if (this.edited === e) this.edited = undefined;
    return this.elements.delete(e);
  }

  get size(): number {
    return this.elements.size;
  }

  get isInitialized(): boolean {
    return this.#value !== notInitialized;
  }

  /** Discards the value. The edited control is kept. */
  uninitialize() {
    this.#value = notInitialized;
  }

  markAsEdited(e: HTMLStorageFormControlElement) {
    if (!this.isInitialized && this.elements.has(e)) this.edited = e;
  }

  /**
   * @returns The value edited before the initialization if it should be stored
   *   because nothing is stored.
   */
  load(storedValue: string | undefined): string | undefined {
    const edited = this.edited;
    this.edited = undefined;
    if (storedValue !== undefined || edited === undefined) {
      this.value = storedValue;
      return undefined;
    }

    // Not the edited value, because the following queued reads may also return
    // nothing while the write is delayed, and then reset the controls.
    this.#value = undefined;
    const change = storageControlsHandler.diff(edited, undefined);
    const editedValue = change.type === "value" ? change.value : undefined;
    this.writeElements(editedValue, edited);
    return editedValue;
  }

  set value(newValue: string | undefined) {
    if (this.#value === newValue) return;
    this.#value = newValue;
    this.writeElements(newValue);
  }

  private writeElements(
    value: string | undefined,
    except?: HTMLStorageFormControlElement,
  ) {
    const changedElements: HTMLStorageFormControlElement[] = [];
    for (const e of this.elements) {
      if (e === except) continue;
      const isUpdated = storageControlsHandler.write(e, value);
      if (isUpdated) changedElements.push(e);
    }
    if (changedElements.length > 0) dispatchChangeEvent(...changedElements);
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
      const e = event.target;
      if (!matchesStorageControl(e)) return;
      this.namedControlMap.get(e.name)?.markAsEdited(e);
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
      this.updateControls();
      this.uninitializeControls();
    }

    private uninitializeControls() {
      for (const elementSet of this.namedControlMap.values())
        elementSet.uninitialize();
    }

    /**
     * Synchronizes {@link namedControlMap} with the current DOM tree.
     *
     * The tree is scanned instead of tracing mutation records, because a record
     * does not tell the state at that time, such as the name of a removed control.
     */
    private updateControls() {
      const controls = new Set<HTMLStorageFormControlElement>();
      for (const e of this.querySelectorAll(STORAGE_CONTROL_SELECTOR)) {
        if (matchesStorageControl(e)) controls.add(e);
      }
      for (const [name, elementSet] of this.namedControlMap) {
        for (const e of elementSet) {
          if (!controls.has(e) || e.name !== name)
            this.namedControlMap.deleteByKeyValue(name, e);
        }
      }
      for (const e of controls) this.namedControlMap.add(e);
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
        // Edits must not be compared with the values of the old area.
        if (oldValue !== newValue) this.uninitializeControls();
        this.invokeStorageChangeCallback();
      }
    }

    //

    override async storageChangeCallback(updates: WroteValues) {
      if (updates.size === 0) {
        await this.loadValues();
        return;
      }
      for (const [name, elementSet] of this.namedControlMap) {
        // Uninitialized values will be loaded by a queued task.
        if (elementSet.isInitialized && updates.has(name))
          elementSet.value = updates.get(name);
      }
    }

    private async loadValues() {
      const area = this.storageArea;
      const keys = [...this.namedControlMap.keys()];
      const storedValues = await this.areaHandler.read(keys);
      // Values of the new area will be loaded by a queued task.
      if (area !== this.storageArea) return;

      const editedValues: WroteValues = new Map();
      for (const name of keys) {
        const editedValue = this.namedControlMap
          .get(name)
          ?.load(storedValues.get(name));
        if (editedValue !== undefined) editedValues.set(name, editedValue);
      }
      // Not awaited, because a delayed write would block queued tasks.
      if (editedValues.size > 0)
        this.areaHandler.write(editedValues).catch(console.error);
    }

    //

    private readonly observerOptions = {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["name"],
    };

    private handleMutations() {
      this.updateControls();
      this.invokeStorageChangeCallback();
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
