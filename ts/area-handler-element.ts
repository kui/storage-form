import {
  dispatchChangeEvent,
  type HTMLElementConstructor,
  type StorageElementMixin,
} from "./elements.js";

import { FacadeAreaHandler } from "./area-handler.js";
import { SerialTaskExecutor } from "./promises.js";
import { distinctConcat } from "./arrays.js";

interface AreaHandlerElement extends HTMLElement {
  storageArea: string;
  readonly areaHandler: FacadeAreaHandler;
  storageChangeCallback(): void | Promise<void>;
}
interface StorageFormChildAreaHandlerElement extends AreaHandlerElement {
  readonly storageForm: StorageElementMixin | null;
}

export function mixinAreaHandlerElement<
  T extends HTMLElementConstructor<HTMLElement>,
>(base: T): T & HTMLElementConstructor<AreaHandlerElement> {
  return class extends base {
    #areaHandler = new FacadeAreaHandler();
    private areaListening: { stop(): void } | null = null;
    private readonly taskExecutor = new SerialTaskExecutor();
    private readonly invokeOnChange = () => {
      this.taskExecutor.enqueueNoWait(() => this.storageChangeCallback());
    };

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
      this.areaListening = this.areaHandler.onChange(this.invokeOnChange);
      this.areaHandler.updateArea(this.storageArea);
      this.addEventListener("change", this.invokeOnChange);
      this.invokeOnChange();
    }

    adoptedCallback() {
      super.adoptedCallback?.();
      this.areaHandler.updateArea(this.storageArea);
      this.invokeOnChange();
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
      this.removeEventListener("change", this.invokeOnChange);
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
        this.invokeOnChange();
      }
    }

    //

    storageChangeCallback(): void | Promise<void> {
      throw new Error("Method not implemented.");
    }
  };
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
            dispatchChangeEvent(this);
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
      dispatchChangeEvent(this);
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

function parentOrShadowRootHost(element: HTMLElement): HTMLElement | null {
  const parent = element.parentElement;
  if (parent !== null) return parent;
  const shadowRoot = element.getRootNode();
  if (!(shadowRoot instanceof ShadowRoot)) return null;
  const host = shadowRoot.host;
  if (!(host instanceof HTMLElement)) return null;
  return host;
}
