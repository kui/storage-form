import { listAreas } from "./area-handler.js";
import type {
  HTMLElementConstructor,
  StorageElementMixin,
  ValueContainerElement,
} from "./elements.js";
import { parentOrShadowRootHost } from "./elements.js";
import { allCustomElementsDefinedEvent } from "./globals.js";
import { mixinMonoStorageControl } from "./storage-mono-controls.js";

export function mixinAreaSelect<
  T extends HTMLElementConstructor<ValueContainerElement>,
>(base: T): T {
  return class extends base {
    readonly isNotStorageControl = true;
    #target: StorageElementMixin | null = null;
    private readonly onChangeListener = (event: Event) => {
      if (event.target !== this) return;
      this.updateTargetStorage();
    };

    get target(): StorageElementMixin | null {
      return this.#target ?? this.getTargetByParent();
    }
    set target(v: StorageElementMixin | null) {
      this.#target = v;
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

      this.updateTargetStorage();
      allCustomElementsDefinedEvent.listeners.push(
        () => {
          this.updateTargetStorage();
        }
      );

      this.addEventListener("change", this.onChangeListener);
      this.addEventListener("input", this.onChangeListener);
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
      this.removeEventListener("change", this.onChangeListener);
      this.removeEventListener("input", this.onChangeListener);
    }

    private updateTargetStorage() {
      const target = this.target;
      if (target === null) return;
      target.storageArea = this.value;
    }

    private getTargetByParent(): StorageElementMixin | null {
      let parent = parentOrShadowRootHost(this);
      while (parent !== null) {
        if (typeof (parent as StorageElementMixin).storageArea === "string")
          return parent as StorageElementMixin;
        parent = parentOrShadowRootHost(parent);
      }
      return null;
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
