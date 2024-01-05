import {
  mixinAreaHandlerElement,
  type AreaHandlerElement,
} from "./area-handler-element.js";
import { distinctConcat } from "./arrays.js";
import {
  dispatchChangeEvent,
  type HTMLElementConstructor,
  type StorageFormLikeElement,
  type ValueContainerElement,
} from "./elements.js";
import { WroteValues } from "./globals.js";
import * as storageControlsHandler from "./storage-controls-handler.js";

export interface FormControlLikeElement<V = string>
  extends ValueContainerElement<V> {
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
      if (event.target === this)
        this.valueChangedCallback().catch(console.error);
    };

    #value: string | typeof notInitialized | undefined = notInitialized;

    override connectedCallback() {
      super.connectedCallback?.();
      this.addEventListener("change", this.valueChangedListener);
      this.addEventListener("input", this.valueChangedListener);
    }

    override disconnectedCallback() {
      super.disconnectedCallback?.();
      this.removeEventListener("change", this.valueChangedListener);
      this.removeEventListener("input", this.valueChangedListener);
    }

    static readonly observedAttributes = distinctConcat(
      super.observedAttributes ?? [],
      ["name", "value"],
    );

    override attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null,
    ) {
      super.attributeChangedCallback?.(name, oldValue, newValue);
      if (name === "name") {
        this.invokeStorageChangeCallback();
      } else if (name === "value") {
        this.valueChangedCallback().catch(console.error);
      }
    }

    override async storageChangeCallback(updates: WroteValues) {
      let isUpdated = false;
      if (updates.size === 0) {
        // If empty, it means to change storage entry binded with this element.
        // So, fetch the new entry.
        const newValue = (await this.areaHandler.read([this.name])).get(
          this.name,
        );
        this.#value = newValue;
        isUpdated = storageControlsHandler.write(this, newValue);
      } else if (updates.has(this.name)) {
        // If not empty and contains this element's name, it just means that
        // the storage value has changed.
        const newValue = updates.get(this.name);
        this.#value = newValue;
        isUpdated = storageControlsHandler.write(this, newValue);
      }
      if (isUpdated) dispatchChangeEvent(this);
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
