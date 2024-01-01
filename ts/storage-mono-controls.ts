import type {
  HTMLElementConstructor,
  StorageFormLikeElement,
  ValueContainerElement,
} from "./elements.js";
import type { AreaHandlerElement } from "./area-handler-element.js";

import { mixinAreaHandlerElement } from "./area-handler-element.js";

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

    override connectedCallback() {
      super.connectedCallback?.();
    }

    override disconnectedCallback() {
      super.disconnectedCallback?.();
    }

    override async storageChangeCallback() {
      if (this.name === "") return;
      this.value =
        (await this.areaHandler.read([this.name])).get(this.name) ??
        this.defaultValue ??
        "";
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
