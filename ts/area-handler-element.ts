import type {
  HTMLElementConstructor,
  StorageElementMixin,
} from "./elements.js";
import { AreaHandler, FacadeAreaHandler } from "./area-handler.js";

interface AreaHandlerElement extends HTMLElement {
  readonly storageUsage: true;
  readonly storageForm: StorageElementMixin | null;
  storageArea: string;
  readonly areaHandler: AreaHandler;
}

export function mixinAreaHandlerElement<
  T extends HTMLElementConstructor<HTMLElement>,
>(base: T): T & HTMLElementConstructor<AreaHandlerElement> {
  return class extends base {
    readonly storageUsage = true;
    #areaHandler = new FacadeAreaHandler();
    #storageForm: StorageElementMixin | null = null;
    private readonly storageFormObserver = new MutationObserver(
      this.onStorageFormMutation.bind(this),
    );
    private areaListening: { stop(): void } | null = null;

    get storageForm() {
      return this.#storageForm;
    }

    get storageArea() {
      return (
        this.getAttribute("storage-area") ??
        this.#storageForm?.storageArea ??
        ""
      );
    }
    set storageArea(v: string) {
      this.setAttribute("storage-area", v);
    }

    get areaHandler() {
      return this.#areaHandler;
    }

    private onStorageFormMutation(mutaions: MutationRecord[]) {
      for (const mutaion of mutaions) {
        if (mutaion.type === "attributes") {
          if (mutaion.attributeName === "storage-area") {
            this.#areaHandler.updateArea(this.storageArea);
          }
        }
      }
    }

    private getStorageForm(): StorageElementMixin | null {
      let parent = this.parentElement;
      while (parent !== null && !(parent as StorageElementMixin).storageArea)
        parent = parent.parentElement;
      return parent === null ? null : (parent as StorageElementMixin);
    }

    connectedCallback() {
      super.connectedCallback?.();
      this.areaListening = this.#areaHandler.onChange(
        this.handleChange.bind(this),
      );
      this.updateStorageForm();
      this.#areaHandler.updateArea(this.storageArea);
      this.handleChange()?.catch(console.error);
    }

    adoptedCallback() {
      super.adoptedCallback?.();
      this.updateStorageForm();
      this.#areaHandler.updateArea(this.storageArea);
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
      this.storageFormObserver.disconnect();
      this.areaListening?.stop();
      this.areaListening = null;
    }

    static readonly observedAttributes = ["storage-area"];

    attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null,
    ) {
      super.attributeChangedCallback?.(name, oldValue, newValue);
      if (name === "storage-area") {
        this.#areaHandler.updateArea(newValue);
      }
    }

    //
    protected handleChange(): void | Promise<void> {
      throw new Error("Method not implemented.");
    }

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
    }
  };
}
