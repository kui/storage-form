import type {
  HTMLElementConstructor,
  StorageElementMixin,
} from "./elements.js";

import type { ValueChanges } from "./area-handler.js";

import { FacadeAreaHandler } from "./area-handler.js";
import { SerialTaskExecutor } from "./promises.js";
import { distinctConcat } from "./arrays.js";
import { parentOrShadowRootHost } from "./elements.js";

export interface AreaHandlerElement extends HTMLElement {
  storageArea: string;
  readonly areaHandler: FacadeAreaHandler;
  invokeStorageChangeCallback(changes?: ValueChanges): void;
  /**
   * @param changes If no entries, it means to change storage area reference.
   */
  storageChangeCallback(changes: ValueChanges): void | Promise<void>;
}

export function mixinAreaHandlerElement<
  T extends HTMLElementConstructor<HTMLElement>,
>(base: T): T & HTMLElementConstructor<AreaHandlerElement> {
  return class extends base {
    #areaHandler = new FacadeAreaHandler();
    private areaListening: { stop(): void } | null = null;
    private readonly taskExecutor = new SerialTaskExecutor();

    get storageArea() {
      return this.getAttribute("storage-area") ?? "";
    }
    set storageArea(v: string) {
      this.setAttribute("storage-area", v);
    }

    get areaHandler() {
      return this.#areaHandler;
    }

    connectedCallback() {
      super.connectedCallback?.();
      this.areaListening = this.areaHandler.onChange(
        this.invokeStorageChangeCallback.bind(this),
      );
      this.areaHandler.updateArea(this.storageArea);
      this.invokeStorageChangeCallback();
    }

    adoptedCallback() {
      super.adoptedCallback?.();
      this.areaHandler.updateArea(this.storageArea);
      this.invokeStorageChangeCallback();
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
      this.areaListening?.stop();
      this.areaListening = null;
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
        this.areaHandler.updateArea(newValue);
        this.invokeStorageChangeCallback();
      }
    }

    invokeStorageChangeCallback(changes: ValueChanges = new Map()) {
      this.taskExecutor.enqueueNoWait(() =>
        this.storageChangeCallback(changes),
      );
    }

    /**
     * Implement this method to handle storage changes.
     *
     * Should not call this method directly. Call {@link invokeStorageChangeCallback} instead.
     *
     * @param _changes If no entries, it means to change storage area reference.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    storageChangeCallback(_changes: ValueChanges): void | Promise<void> {
      throw new Error("Method not implemented.");
    }
  };
}

export interface StorageFormChildAreaHandlerElement extends AreaHandlerElement {
  readonly storageForm: StorageElementMixin | null;
}

export function mixinStorageFormChildAreaHandlerElement<
  T extends HTMLElementConstructor<HTMLElement>,
>(base: T): T & HTMLElementConstructor<StorageFormChildAreaHandlerElement> {
  return class extends mixinAreaHandlerElement(base) {
    #storageForm: StorageElementMixin | null = null;
    private readonly storageFormObserver = new MutationObserver(
      this.onStorageFormMutation.bind(this),
    );

    get storageForm() {
      return this.#storageForm;
    }

    get storageArea() {
      const a = super.storageArea;
      return a === "" && this.storageForm !== null
        ? this.storageForm.storageArea
        : a;
    }

    private onStorageFormMutation(mutaions: MutationRecord[]) {
      for (const mutaion of mutaions) {
        if (mutaion.type === "attributes") {
          if (mutaion.attributeName === "storage-area") {
            this.updateArea();
            this.invokeStorageChangeCallback();
          }
        }
      }
    }

    connectedCallback() {
      super.connectedCallback?.();
      this.updateStorageForm();
    }

    adoptedCallback() {
      super.adoptedCallback?.();
      this.updateStorageForm();
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
      this.storageFormObserver.disconnect();
    }

    //

    private updateStorageForm() {
      const form = this.getStorageForm();
      if (form === this.#storageForm) return;

      if (form === null) {
        this.storageFormObserver.disconnect();
      } else {
        this.storageFormObserver.disconnect();
        this.storageFormObserver.observe(form, {
          attributes: true,
          attributeFilter: ["storage-area"],
        });
      }
      this.#storageForm = form;
      this.updateArea();
      this.invokeStorageChangeCallback();
    }

    private getStorageForm(): StorageElementMixin | null {
      let parent = parentOrShadowRootHost(this);
      while (parent !== null && !(parent as StorageElementMixin).storageArea)
        parent = parentOrShadowRootHost(parent);
      return parent === null ? null : (parent as StorageElementMixin);
    }

    private updateArea() {
      this.areaHandler.updateArea(this.storageArea);
    }
  };
}
