import { mixinAreaHandlerElement } from "./area-handler-element.js";
import { distinctConcat } from "./arrays.js";
import {
  type HTMLElementConstructor,
  type StorageElementMixin,
  type StorageFormLikeElement,
} from "./elements.js";
import { WroteValues } from "./globals.js";
import { NamedSetMap, setAll } from "./maps.js";
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

/** Change events dispatched by storage forms, not by users. */
const ownEvents = new WeakSet<Event>();

function dispatchOwnChangeEvents(elements: Iterable<EventTarget>) {
  for (const element of elements) {
    const event = new Event("change", { bubbles: true });
    ownEvents.add(event);
    element.dispatchEvent(event);
  }
}

const notInitialized = Symbol("notInitialized");

class NamedStorageControlsCollection {
  private readonly elements = new Set<HTMLStorageFormControlElement>();
  readonly name: string;
  #value: string | undefined | typeof notInitialized = notInitialized;
  /** The last control edited before the value is initialized. */
  private edited: HTMLStorageFormControlElement | undefined;
  /** The edited value being written by {@link load}. */
  private pendingValue: string | undefined;

  constructor(e: HTMLStorageFormControlElement) {
    this.name = e.name;
  }

  add(e: HTMLStorageFormControlElement) {
    if (e.name !== this.name) throw Error("Invalid name");
    if (this.elements.has(e)) return this;
    this.elements.add(e);
    if (this.#value !== notInitialized) {
      storageControlsHandler.write(e, this.pendingValue ?? this.#value);
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

  /** Called if the write of the edited value failed. */
  discardPendingValue(value: string) {
    if (this.pendingValue === value) this.pendingValue = undefined;
  }

  get isPending(): boolean {
    return this.pendingValue !== undefined;
  }

  markAsEdited(e: HTMLStorageFormControlElement) {
    if (this.elements.has(e)) this.edited = e;
  }

  /**
   * Change events should be dispatched to `changed` by the caller.
   *
   * @returns `editedValue` is the value edited before the initialization. It
   *   should be stored if defined, because nothing is stored.
   */
  load(storedValue: string | undefined): {
    editedValue?: string;
    changed: HTMLStorageFormControlElement[];
  } {
    const edited = this.edited;
    this.edited = undefined;
    if (storedValue !== undefined || edited === undefined)
      return { changed: this.setValue(storedValue) };

    // Not the edited value, because the following queued reads may also return
    // nothing while the write is delayed, and then reset the controls.
    this.#value = undefined;
    const change = storageControlsHandler.diff(edited, undefined);
    const editedValue = change.type === "value" ? change.value : undefined;
    this.pendingValue = editedValue;
    return { editedValue, changed: this.writeElements(editedValue, edited) };
  }

  /** @returns The changed controls, to which change events should be dispatched. */
  setValue(newValue: string | undefined): HTMLStorageFormControlElement[] {
    if (this.#value === newValue) return [];
    this.#value = newValue;
    this.pendingValue = undefined;
    return this.writeElements(newValue);
  }

  private writeElements(
    value: string | undefined,
    except?: HTMLStorageFormControlElement,
  ) {
    const changed: HTMLStorageFormControlElement[] = [];
    for (const e of this.elements) {
      if (e === except) continue;
      const isUpdated = storageControlsHandler.write(e, value);
      if (isUpdated) changed.push(e);
    }
    return changed;
  }

  diff() {
    if (this.#value === notInitialized) return "notInitialized";

    const oldValue = this.pendingValue ?? this.#value;
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
    /** The number of loadings being queued or running */
    private remainingLoads = 0;
    private readonly changeListener = (event: Event) => {
      const e = event.target;
      if (!matchesStorageControl(e)) return;
      const isOwnEvent = ownEvents.has(event);
      const elementSet = this.namedControlMap.get(e.name);
      if (!isOwnEvent && elementSet?.isInitialized === false) {
        elementSet.markAsEdited(e);
        // Retry if the last loading failed
        if (this.remainingLoads === 0) this.invokeStorageChangeCallback();
      }
      this.valueChangedCallback(isOwnEvent).catch(console.error);
    };

    connectedCallback() {
      // Storage custom elements cannot be told from plain controls until they are
      // upgraded, and descendants are upgraded after this by default.
      customElements.upgrade(this);
      this.initControls();
      super.connectedCallback?.();
      this.mutationObserver.observe(this, this.observerOptions);
      this.addEventListener("change", this.changeListener);
      this.addEventListener("input", this.changeListener);
    }

    private initControls() {
      this.uninitializeControls();
      this.updateControls();
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

    override invokeStorageChangeCallback(updates: WroteValues = new Map()) {
      if (updates.size === 0) this.remainingLoads++;
      super.invokeStorageChangeCallback(updates);
    }

    override async storageChangeCallback(updates: WroteValues) {
      if (updates.size > 0) {
        this.applyValues(updates);
        return;
      }
      try {
        await this.loadValues();
      } finally {
        this.remainingLoads--;
      }
    }

    private async loadValues() {
      const area = this.storageArea;
      const values: WroteValues = new Map(
        [...this.namedControlMap.keys()].map((n) => [n, undefined]),
      );
      setAll(values, await this.areaHandler.read([...values.keys()]));
      // Values of the new area will be loaded by a queued task.
      if (area === this.storageArea) this.applyValues(values, true);
    }

    private applyValues(values: WroteValues, isLoading = false) {
      const editedValues: WroteValues = new Map();
      const changedControls: HTMLStorageFormControlElement[] = [];
      for (const [name, elementSet] of this.namedControlMap) {
        if (!values.has(name)) continue;
        // Uninitialized values will be loaded by a queued task.
        if (!isLoading && !elementSet.isInitialized && this.remainingLoads > 0)
          continue;
        const { editedValue, changed } = elementSet.load(values.get(name));
        if (editedValue !== undefined) editedValues.set(name, editedValue);
        changedControls.push(...changed);
      }
      // Not awaited, because a delayed write would block queued tasks.
      if (editedValues.size > 0)
        this.areaHandler.write(editedValues).catch((error: unknown) => {
          for (const [name, value] of editedValues)
            if (value !== undefined)
              this.namedControlMap.get(name)?.discardPendingValue(value);
          console.error(error);
        });
      // At the end, because listeners may change the area.
      dispatchOwnChangeEvents(changedControls);
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

    private async valueChangedCallback(isOwnEvent: boolean): Promise<void> {
      const entries: WroteValues = new Map();
      for (const [name, elementSet] of this.namedControlMap) {
        // Events by loading must not write values of other controls over the edit.
        if (isOwnEvent && elementSet.isPending) continue;
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
