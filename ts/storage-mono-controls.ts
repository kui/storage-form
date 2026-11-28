import {
  mixinAreaHandlerElement,
  type AreaHandlerElement,
} from "./area-handler-element.js";
import { distinctConcat } from "./arrays.js";
import {
  dispatchOwnChangeEvent,
  isOwnChangeEvent,
  type HTMLElementConstructor,
  type StorageFormLikeElement,
  type ValueContainerElement,
} from "./elements.js";
import { WroteValues } from "./globals.js";
import * as storageControlsHandler from "./storage-controls-handler.js";

export interface FormControlLikeElement<
  V = string,
> extends ValueContainerElement<V> {
  defaultValue?: V;
}

export type MonoStorageControlMixin = AreaHandlerElement &
  FormControlLikeElement &
  StorageFormLikeElement;

const notInitialized = Symbol("notInitialized");

export function mixinMonoStorageControl<
  T extends HTMLElementConstructor<FormControlLikeElement>,
>(base: T): T & HTMLElementConstructor<MonoStorageControlMixin> {
  return class extends mixinAreaHandlerElement(base) {
    readonly isNotStorageControl = true;
    private readonly valueChangedListener = (event: Event) => {
      // Values written by mono controls are the stored ones or the defaults of
      // removed values, which must not be stored.
      if (isOwnChangeEvent(event)) return;
      if (event.target === this)
        this.valueChangedCallback().catch(console.error);
    };

    #value: string | typeof notInitialized | undefined = notInitialized;
    #queuedLoadCount = 0;

    override connectedCallback() {
      super.connectedCallback?.();
      this.addEventListener("change", this.valueChangedListener);
      this.addEventListener("input", this.valueChangedListener);
    }

    override disconnectedCallback() {
      this.#value = notInitialized;
      super.disconnectedCallback?.();
      this.removeEventListener("change", this.valueChangedListener);
      this.removeEventListener("input", this.valueChangedListener);
    }

    static override readonly observedAttributes = distinctConcat(
      super.observedAttributes ?? [],
      ["name", "value"],
    );

    override attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null,
    ) {
      // The known value belongs to the previous entry, so it must not be
      // compared with inputs until the new entry is loaded.
      if ((name === "name" || name === "storage-area") && oldValue !== newValue)
        this.#value = notInitialized;

      super.attributeChangedCallback?.(name, oldValue, newValue);
      if (name === "name") {
        this.invokeStorageChangeCallback();
      } else if (name === "value" && this.isSubmittedValueAttribute()) {
        this.valueChangedCallback().catch(console.error);
      }
    }

    // The value attribute of a checkbox or a radio is the submitted value
    // itself, not an initial value. For other controls, it is only an initial
    // value, so a change must not overwrite the value that the user or the
    // storage has set.
    private isSubmittedValueAttribute(): boolean {
      const type = (this as { type?: string }).type;
      return type === "checkbox" || type === "radio";
    }

    override invokeStorageChangeCallback(updates: WroteValues = new Map()) {
      if (updates.size === 0) this.#queuedLoadCount++;
      super.invokeStorageChangeCallback(updates);
    }

    override async storageChangeCallback(updates: WroteValues) {
      if (updates.size === 0) this.#queuedLoadCount--;
      if (!this.#canApplyStoredValue()) return;

      let isUpdated = false;
      if (updates.size === 0) {
        // If empty, it means to change storage entry binded with this element.
        // So, fetch the new entry.
        const newValue = (await this.areaHandler.read([this.name])).get(
          this.name,
        );
        if (!this.#canApplyStoredValue()) return;
        this.#value = newValue;
        isUpdated = storageControlsHandler.write(this, newValue);
      } else if (updates.has(this.name)) {
        // If not empty and contains this element's name, it just means that
        // the storage value has changed.
        const newValue = updates.get(this.name);
        this.#value = newValue;
        isUpdated = storageControlsHandler.write(this, newValue);
      }
      if (isUpdated) dispatchOwnChangeEvent(this);
    }

    #canApplyStoredValue(): boolean {
      return (
        this.isConnected &&
        this.storageArea !== "" &&
        // Until the value is known, a queued load means that this one may be for
        // a previous entry, or may have run before connectedCallback sets the
        // area during an upgrade.
        (this.#value !== notInitialized || this.#queuedLoadCount === 0)
      );
    }

    private async valueChangedCallback(): Promise<void> {
      if (this.#value === notInitialized) return;

      const entries: WroteValues = new Map();
      const diff = storageControlsHandler.diff(this, this.#value);
      if (diff.type === "unselected") {
        entries.set(this.name, undefined);
      } else if (diff.type === "value") {
        entries.set(this.name, diff.value);
      }

      if (entries.size > 0) await this.areaHandler.write(entries);
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
