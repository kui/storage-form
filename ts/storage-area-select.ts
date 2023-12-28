import { listAreas } from "./area-handler.js";
import { updateValue } from "./elements.js";
import { mixinMonoStorageControl } from "./storage-mono-controls.js";

import type { StorageElementMixin, ValueContainerElement } from "./elements.js";

type ValueContainerElementConstructor<
  T extends HTMLElement = ValueContainerElement,
> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]) => T;

export function mixinAreaSelect<T extends ValueContainerElementConstructor>(
  base: T,
): T {
  return class extends base {
    #target: StorageElementMixin | null = null;
    readonly isNotStorageControl = true;
    private readonly onChangeListener = this.onChange.bind(this);

    // Workaround for ts2545 error.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    constructor(..._: any[]) {
      super();
      this.addEventListener("change", this.onChangeListener);
      this.addEventListener("input", this.onChangeListener);
    }

    get target(): StorageElementMixin | null {
      return this.#target;
    }
    set target(newTarget: StorageElementMixin | null) {
      const oldTarget = this.#target;
      this.#target = newTarget;
      if (oldTarget !== newTarget)
        updateValue(this, newTarget?.storageArea ?? "");
    }
    get targetSelector(): string | null {
      return this.getAttribute("target-selector");
    }
    set targetSelector(v: string | null) {
      if (v === null) this.removeAttribute("target-selector");
      else this.setAttribute("target-selector", v);
    }

    private onChange(event: Event) {
      if (event.target !== this) return;
      if (this.#target === null) return;
      this.#target.storageArea = this.value;
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
      this.updateTarget();
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
    }

    private updateTarget() {
      this.target =
        this.target ?? this.getTargetByAttribute() ?? this.getTargetByParent();
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

    static readonly observedAttributes = ["target-selector"];

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
