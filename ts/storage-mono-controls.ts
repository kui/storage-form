import type {
  HTMLElementConstructor,
  StorageFormLikeElement,
  ValueContainerElement,
} from "./elements.js";
import type { AreaHandlerElement } from "./area-handler-element.js";
import type { ValueChanges, WroteValues } from "./area-handler.js";

import { mixinAreaHandlerElement } from "./area-handler-element.js";
import * as storageControlsHandler from "./storage-controls-handler.js";
import { SerialTaskExecutor } from "./promises.js";
import { distinctConcat } from "./arrays.js";

export interface FormControlLikeElement<V = string>
  extends ValueContainerElement<V> {
  defaultValue?: V;
}

export type MonoStorageControlMixin = AreaHandlerElement &
  FormControlLikeElement &
  StorageFormLikeElement;

export function mixinMonoStorageControl<
  T extends HTMLElementConstructor<FormControlLikeElement>,
>(base: T): T & HTMLElementConstructor<MonoStorageControlMixin> {
  return class extends mixinAreaHandlerElement(base) {
    readonly isNotStorageControl = true;
    private readonly taskExecutor = new SerialTaskExecutor();
    private readonly valueChangedListener = (event: Event) => {
      if (event.target === this) this.invokeValueChangedCallback();
    };

    #value = this.defaultValue;

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
        this.invokeValueChangedCallback();
      }
    }

    override async storageChangeCallback(changes: ValueChanges) {
      if (changes.size === 0) {
        // If empty, it means to change storage entry binded with this element.
        // So, fetch the new entry.
        const newValue = (await this.areaHandler.read([this.name])).get(
          this.name,
        );
        this.#value = newValue;
        storageControlsHandler.write(this, newValue);
      } else if (changes.has(this.name)) {
        // If not empty and contains this element's name, it just means that
        // the storage value has changed.
        const newValue = changes.get(this.name)?.newValue;
        this.#value = newValue;
        storageControlsHandler.write(this, newValue);
      }
    }

    private invokeValueChangedCallback(): void {
      this.taskExecutor.enqueueNoWait(() => this.valueChangedCallback());
    }

    private async valueChangedCallback(): Promise<void> {
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
