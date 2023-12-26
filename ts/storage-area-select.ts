import { listAreas } from "./area-handler.js";
import { SerialTaskExecutor } from "./promises.js";
import { StorageElementMixin } from "./storage-element.js";
import { mixinMonoStorageControl } from "./storage-mono-controls.js";
import {
  ValueChangeDetail,
  ValueObserver,
  ValueObserverContainer,
} from "./value-observer.js";

interface AreaSelectTargetParent extends HTMLElement {
  value: string;
}

type ValueContainerElementConstructor<
  T extends HTMLElement = AreaSelectTargetParent,
> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]) => T;

export function mixinAreaSelect<T extends ValueContainerElementConstructor>(
  base: T,
): T {
  return class extends base {
    #target: StorageElementMixin | null = null;
    private valueObserverContainer: ValueObserverContainer | null = null;
    private readonly taskExecutor = new SerialTaskExecutor();
    readonly isNotStorageControl = true;

    // Workaround for ts2545 error.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    constructor(...args: any[]) {
      super();
      this.addEventListener("valuechange", ((
        event: CustomEvent<ValueChangeDetail>,
      ) => {
        if (this.#target) this.#target.storageArea = event.detail.newValue;
      }) as EventListener);
    }

    get target(): StorageElementMixin | null {
      return this.#target;
    }
    set target(newTarget: StorageElementMixin | null) {
      this.#target = newTarget;
      if (newTarget) {
        this.value = newTarget.storageArea;
        this.valueObserverContainer?.instance.sync();
      }
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
      this.taskExecutor.enqueueNoWait(async () => {
        this.target =
          this.target ??
          this.getTargetByAttribute() ??
          this.getTargetByParent();
        this.valueObserverContainer = await ValueObserver.observe(this, {
          enablePolling: true,
        });
      });
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
      this.taskExecutor.enqueueNoWait(async () => {
        await this.valueObserverContainer?.release();
        this.valueObserverContainer = null;
      });
    }

    private getTargetByAttribute(): StorageElementMixin | null {
      const selector = this.getAttribute("target-selector");
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
