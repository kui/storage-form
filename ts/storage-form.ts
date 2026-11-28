import { mixinAreaHandlerElement } from "./area-handler-element.js";
import { distinctConcat } from "./arrays.js";
import {
  afterPropagation,
  dispatchOwnChangeEvent,
  dispatchWriteEvent,
  findStorageForm,
  isOwnChangeEvent,
  isStorageForm,
  isValid,
  storageFormMarker,
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

/**
 * Controls edited before the value of their name is loaded, with the order of
 * the edits. It is kept on the controls, not in a form, because the form which
 * loads the value may change before the loading, e.g. while storage-area is
 * being set, removed or changed. Edits of controls in no storage form are not
 * known.
 */
const unloadedEdits = new WeakMap<HTMLStorageFormControlElement, number>();
let editCount = 0;

function findOwner(e: HTMLStorageFormControlElement) {
  // Either option gives the same owner, because controls found by
  // querySelectorAll or retargeted events are in the tree of the form.
  return findStorageForm(e, { crossShadowRoots: false });
}

const notInitialized = Symbol("notInitialized");

class NamedStorageControlsCollection {
  private readonly elements = new Set<HTMLStorageFormControlElement>();
  readonly name: string;
  #value: string | undefined | typeof notInitialized = notInitialized;
  /** The edited value being written by {@link load}. */
  private pendingValue: string | undefined;

  constructor(e: HTMLStorageFormControlElement) {
    this.name = e.name;
  }

  /** @param write `false` to keep the value of the control being edited. */
  add(e: HTMLStorageFormControlElement, write = true) {
    if (e.name !== this.name) throw Error("Invalid name");
    if (this.elements.has(e)) return this;
    this.elements.add(e);
    if (this.#value !== notInitialized) {
      // The loaded value is shown, or the edit is stored by the caller.
      unloadedEdits.delete(e);
      if (write)
        storageControlsHandler.write(e, this.pendingValue ?? this.#value);
    }
    // Donot dispatch change event here because it is overwritten by the value
    return this;
  }

  delete(e: HTMLStorageFormControlElement) {
    return this.elements.delete(e);
  }

  has(e: HTMLStorageFormControlElement) {
    return this.elements.has(e);
  }

  get size(): number {
    return this.elements.size;
  }

  get isInitialized(): boolean {
    return this.#value !== notInitialized;
  }

  /** Discards the value. The edits are kept. */
  uninitialize() {
    this.#value = notInitialized;
  }

  /** Called if the write of the edited value failed. */
  discardPendingValue(value: string) {
    if (this.pendingValue === value) this.pendingValue = undefined;
  }

  /** Takes the last edited control, and forgets the edits of the others. */
  private takeEdited(): HTMLStorageFormControlElement | undefined {
    let edited: HTMLStorageFormControlElement | undefined;
    let editedAt = -1;
    for (const e of this.elements) {
      const at = unloadedEdits.get(e);
      unloadedEdits.delete(e);
      if (at !== undefined && at > editedAt) {
        edited = e;
        editedAt = at;
      }
    }
    return edited;
  }

  /**
   * Change events should be dispatched to `changed` by the caller.
   *
   * @returns `editedValue` is the value edited before the initialization. It
   *   should be stored if defined, because nothing is stored. `skipped` is the
   *   edited control whose value is not stored, because it is invalid.
   */
  load(
    storedValue: string | undefined,
    validates: (e: HTMLStorageFormControlElement) => boolean,
  ): {
    editedValue: string | undefined;
    skipped?: HTMLStorageFormControlElement;
    changed: HTMLStorageFormControlElement[];
  } {
    const edited = this.takeEdited();
    if (storedValue !== undefined || edited === undefined)
      return { editedValue: undefined, changed: this.setValue(storedValue) };

    // Not the edited value, because the following queued reads may also return
    // nothing while the write is delayed, and then reset the controls.
    this.#value = undefined;
    const change = storageControlsHandler.diff(edited, undefined);
    if (change.type === "value" && !validates(edited)) {
      return {
        editedValue: undefined,
        skipped: edited,
        changed: this.writeElements(undefined, edited),
      };
    }
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

  /**
   * @param edited The control which dispatched the event. It is checked first,
   *   because other controls of the same name may also differ from the value,
   *   such as text inputs when nothing is stored.
   */
  diff(edited?: HTMLStorageFormControlElement) {
    if (this.#value === notInitialized) return "notInitialized";

    const oldValue = this.pendingValue ?? this.#value;
    let newValue: string | undefined = undefined;
    /** The control making the change, whose validity tells whether to store it. */
    let source: HTMLStorageFormControlElement | undefined;
    const elements =
      edited !== undefined && this.elements.has(edited)
        ? new Set([edited, ...this.elements])
        : this.elements;
    for (const e of elements) {
      const change = storageControlsHandler.diff(e, oldValue);
      if (change.type === "unselected") {
        source ??= e;
      } else if (change.type === "value") {
        newValue = change.value;
        source = e;
        break;
      }
    }

    // There are 3 cases by the source and newValue:
    // 1) newValue=string: The value was changed by the source.
    // 2) newValue=undefined, source=defined: The source was made unselected and no control has a new value, so the value was deleted.
    // 3) source=undefined: No changes.
    if (source === undefined) return "nochange";
    return { oldValue, newValue, source };
  }

  [Symbol.iterator]() {
    return this.elements[Symbol.iterator]();
  }
}

export function mixinStorageForm<T extends HTMLElementConstructor<HTMLElement>>(
  base: T,
): T &
  HTMLElementConstructor<
    StorageElementMixin & StorageFormLikeElement & { noValidate: boolean }
  > {
  return class extends mixinAreaHandlerElement(base) {
    readonly isNotStorageControl = true;
    readonly [storageFormMarker] = true;

    private readonly namedControlMap = new NamedSetMap(
      (e: HTMLStorageFormControlElement) =>
        new NamedStorageControlsCollection(e),
    );
    private readonly mutationObserver = new MutationObserver((records) => {
      if (this.hasUnhandledRecords(records)) this.handleMutations();
    });
    /** The number of loadings being queued or running */
    private remainingLoads = 0;
    /**
     * Controls whose edits were not stored because they were invalid, by the
     * name. They are stored on a later edit in the form once valid, because a
     * control may become valid without an event of its own, e.g. by fixing
     * another control which conflicts with it.
     */
    private readonly skippedControls = new Map<
      string,
      HTMLStorageFormControlElement
    >();
    /** Unlike isConnected, this is false before connectedCallback. */
    #isReady = false;
    private readonly changeListener = (event: Event) => {
      // Values written by storage forms are the stored ones or the defaults
      // of removed values, which must not be stored.
      if (isOwnChangeEvent(event)) return;
      const e = event.target;
      if (!matchesStorageControl(e)) return;
      // Name and position changes in the same task must be applied before the
      // diff, and before telling whether the control is owned by this form.
      if (this.hasUnhandledRecords(this.mutationObserver.takeRecords()))
        this.handleMutations(e);
      const { owner, forms } = findOwner(e);
      if (owner === null) {
        // Recorded once by the nearest form, for the form which gets the area.
        if (forms[0] === this) unloadedEdits.set(e, editCount++);
        return;
      }
      if (owner !== this) return;
      const elementSet = this.namedControlMap.get(e.name);
      if (elementSet?.isInitialized === false) {
        unloadedEdits.set(e, editCount++);
        // Retry if the last loading failed
        if (this.remainingLoads === 0) this.invokeStorageChangeCallback();
      }
      // Listeners on the ancestors may set the validity.
      afterPropagation(event, () => {
        if (this.#isReady) this.valueChangedCallback(e).catch(console.error);
      });
    };

    get noValidate(): boolean {
      return this.hasAttribute("novalidate");
    }

    set noValidate(value: boolean) {
      this.toggleAttribute("novalidate", value);
    }

    private readonly validates = (e: HTMLStorageFormControlElement) =>
      this.noValidate || isValid(e);

    override connectedCallback() {
      // Storage custom elements cannot be told from plain controls until they are
      // upgraded, and descendants are upgraded after this by default.
      customElements.upgrade(this);
      this.initControls();
      super.connectedCallback?.();
      this.mutationObserver.observe(this, this.observerOptions);
      this.#isReady = true;
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
     *
     * @param edited The control being edited, whose value must not be
     *   overwritten by the value of its new name.
     */
    private updateControls(edited?: HTMLStorageFormControlElement) {
      const controls = new Set<HTMLStorageFormControlElement>();
      for (const e of this.querySelectorAll(STORAGE_CONTROL_SELECTOR)) {
        if (this.isOwnControl(e)) controls.add(e);
      }
      for (const [name, elementSet] of this.namedControlMap) {
        for (const e of elementSet) {
          if (!controls.has(e) || e.name !== name)
            this.namedControlMap.deleteByKeyValue(name, e);
        }
      }
      for (const e of controls) {
        const elementSet = this.namedControlMap.get(e.name);
        if (elementSet === undefined) this.namedControlMap.add(e);
        else elementSet.add(e, e !== edited);
      }
    }

    /** Controls in a nested storage form are left to the nested form. */
    private isOwnControl(e: unknown): e is HTMLStorageFormControlElement {
      return matchesStorageControl(e) && findOwner(e).owner === this;
    }

    override disconnectedCallback() {
      super.disconnectedCallback?.();
      this.mutationObserver.disconnect();
      this.#isReady = false;
      this.removeEventListener("change", this.changeListener);
      this.removeEventListener("input", this.changeListener);
    }

    static override readonly observedAttributes = distinctConcat(
      super.observedAttributes ?? [],
      ["storage-area"],
    );

    override attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null,
    ) {
      if (name === "storage-area") {
        // Edits must not be compared with the values of the old area.
        if (oldValue !== newValue) this.uninitializeControls();
        // The owned controls depend on the area. Updated before the super class
        // queues the load, which may start at once and read their names.
        // Otherwise, connectedCallback updates them.
        if (this.#isReady) this.updateControls();
      }
      super.attributeChangedCallback?.(name, oldValue, newValue);
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
      const skippedNames: string[] = [];
      const changedControls: HTMLStorageFormControlElement[] = [];
      for (const [name, elementSet] of this.namedControlMap) {
        if (!values.has(name)) continue;
        // Uninitialized values will be loaded by a queued task.
        if (!isLoading && !elementSet.isInitialized && this.remainingLoads > 0)
          continue;
        const { editedValue, skipped, changed } = elementSet.load(
          values.get(name),
          this.validates,
        );
        if (editedValue !== undefined) editedValues.set(name, editedValue);
        if (skipped !== undefined) {
          this.skippedControls.set(name, skipped);
          skippedNames.push(name);
        } else {
          const s = this.skippedControls.get(name);
          // The skipped edit is overwritten by the stored value.
          if (s !== undefined && changed.includes(s))
            this.skippedControls.delete(name);
        }
        changedControls.push(...changed);
      }
      // Not awaited, because a delayed write would block queued tasks.
      if (editedValues.size > 0 || skippedNames.length > 0)
        this.write(editedValues, skippedNames).catch((error: unknown) => {
          for (const [name, value] of editedValues)
            if (value !== undefined)
              this.namedControlMap.get(name)?.discardPendingValue(value);
          console.error(error);
        });
      // At the end, because listeners may change the area.
      for (const e of changedControls) dispatchOwnChangeEvent(e);
    }

    //

    private readonly observerOptions = {
      childList: true,
      subtree: true,
      attributes: true,
      // storage-area of nested forms changes the owner of their controls.
      attributeFilter: ["name", "storage-area"],
    };

    /**
     * Changes of own storage-area are handled by attributeChangedCallback, and
     * storage-area of other elements than nested forms does not change the
     * owner of controls.
     */
    private hasUnhandledRecords(records: MutationRecord[]) {
      return records.some(
        (r) =>
          r.attributeName !== "storage-area" ||
          (r.target !== this && isStorageForm(r.target)),
      );
    }

    private handleMutations(edited?: HTMLStorageFormControlElement) {
      this.updateControls(edited);
      this.invokeStorageChangeCallback();
    }

    private async valueChangedCallback(
      edited: HTMLStorageFormControlElement,
    ): Promise<void> {
      // Only the edited name and the skipped ones, because the other controls
      // may show values not to be stored, such as the defaults of values
      // removed by other windows.
      const controls = new Map(this.skippedControls);
      controls.set(edited.name, edited);
      const entries: WroteValues = new Map();
      const skippedNames: string[] = [];
      for (const [name, control] of controls) {
        const elementSet = this.namedControlMap.get(name);
        const isOwned =
          control === edited ||
          (control.name === name && elementSet?.has(control) === true);
        const diff = isOwned ? elementSet?.diff(control) : undefined;
        // Kept to be compared with the value being loaded.
        if (diff === "notInitialized") continue;
        if (diff === undefined || diff === "nochange") {
          this.skippedControls.delete(name);
        } else if (this.validates(diff.source)) {
          this.skippedControls.delete(name);
          entries.set(name, diff.newValue);
        } else {
          this.skippedControls.set(name, diff.source);
          skippedNames.push(name);
        }
      }
      if (entries.size > 0 || skippedNames.length > 0)
        await this.write(entries, skippedNames);
    }

    /** Writes the entries, and then dispatches a write event. */
    private async write(entries: WroteValues, skipped: string[]) {
      try {
        if (entries.size > 0) await this.areaHandler.write(entries);
      } catch (error) {
        dispatchWriteEvent(this, { written: [], skipped, error });
        throw error;
      }
      dispatchWriteEvent(this, { written: [...entries.keys()], skipped });
    }
  };
}

export class HTMLStorageFormElement extends mixinStorageForm(HTMLElement) {
  static register() {
    customElements.define("storage-form", HTMLStorageFormElement);
  }
}
