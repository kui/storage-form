import type {
  HTMLElementConstructor,
  StorageElementMixin,
  ValueContainerElement,
} from "./elements.js";

import { listAreas } from "./area-handler.js";
import { mixinMonoStorageControl } from "./storage-mono-controls.js";
import { distinctConcat } from "./arrays.js";

export function mixinAreaSelect<
  T extends HTMLElementConstructor<ValueContainerElement>,
>(base: T): T {
  return class extends base {
    target: StorageElementMixin | null = null;
    readonly isNotStorageControl = true;
    private readonly onChangeListener = (event: Event) => {
      if (event.target !== this) return;
      if (this.target === null) return;
      this.target.storageArea = this.value;
    };

    get targetSelector(): string | null {
      return this.getAttribute("target-selector");
    }
    set targetSelector(v: string | null) {
      if (v === null) this.removeAttribute("target-selector");
      else this.setAttribute("target-selector", v);
    }

    connectedCallback() {
      super.connectedCallback?.();
      if (this instanceof HTMLSelectElement && this.options.length === 0) {
        for (const area of listAreas()) {
          const option = document.createElement("option");
          option.value = area;
          option.textContent = area;
          this.appendChild(option);
        }
      }
      this.target =
        this.target ?? this.getTargetByAttribute() ?? this.getTargetByParent();
      if (this.target !== null) this.target.storageArea = this.value;

      this.addEventListener("change", this.onChangeListener);
      this.addEventListener("input", this.onChangeListener);
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
      this.removeEventListener("change", this.onChangeListener);
      this.removeEventListener("input", this.onChangeListener);
    }

    private getTargetByAttribute(): StorageElementMixin | null {
      const selector = this.targetSelector;
      return selector === null ? null : document.querySelector(selector);
    }

    private getTargetByParent(): StorageElementMixin | null {
      let parent = this.parentElement;
      while (parent !== null) {
        if (typeof (parent as StorageElementMixin).storageArea === "string")
          return parent as StorageElementMixin;
        parent = parent.parentElement;
      }
      return null;
    }

    static readonly observedAttributes = distinctConcat(
      super.observedAttributes ?? [],
      ["target-selector"],
    );

    attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null,
    ): void {
      super.attributeChangedCallback?.(name, oldValue, newValue);
      if (name === "target-selector") {
        this.target = this.getTargetByAttribute();
      }
    }
  };
}

export class HTMLAreaSelectElement extends mixinAreaSelect(HTMLSelectElement) {
  static register() {
    customElements.define("area-select", HTMLAreaSelectElement, {
      extends: "select",
    });
  }
}

export class HTMLStorageAreaSelectElement extends mixinMonoStorageControl(
  HTMLAreaSelectElement,
) {
  static register() {
    customElements.define("storage-area-select", HTMLStorageAreaSelectElement, {
      extends: "select",
    });
  }
}
