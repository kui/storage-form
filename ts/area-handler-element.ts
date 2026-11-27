import { FacadeAreaHandler } from "./area-handler.js";
import { distinctConcat } from "./arrays.js";
import type {
  HTMLElementConstructor,
  StorageElementMixin,
} from "./elements.js";
import { storageFormsToClosest } from "./elements.js";
import { WroteValues, allCustomElementsDefinedEvent } from "./globals.js";
import { SerialTaskExecutor } from "./promises.js";

export interface AreaHandlerElement extends HTMLElement {
  storageArea: string;
  readonly areaHandler: FacadeAreaHandler;
  invokeStorageChangeCallback(updates?: WroteValues): void;
  /**
   * @param changes If no entries, it means to change storage area reference.
   */
  storageChangeCallback(updates: WroteValues): void | Promise<void>;
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
        this.areaHandler.updateArea(this.storageArea);
        this.invokeStorageChangeCallback();
      }
    }

    invokeStorageChangeCallback(updates: WroteValues = new Map()) {
      this.taskExecutor.enqueueNoWait(() =>
        this.storageChangeCallback(updates),
      );
    }

    /**
     * Implement this method to handle storage changes.
     *
     * Should not call this method directly. Call {@link invokeStorageChangeCallback} instead.
     *
     * @param _updates If no entries, it means to change storage area reference.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    storageChangeCallback(_updates: WroteValues): void | Promise<void> {
      throw new Error("Method not implemented.");
    }
  };
}

export interface StorageFormChildAreaHandlerElement extends AreaHandlerElement {
  readonly storageForm: StorageElementMixin | null;
  /**
   * Reads the storage again if this element is connected and has an area.
   */
  refreshStorageValue(): void;
}

export function mixinStorageFormChildAreaHandlerElement<
  T extends HTMLElementConstructor<HTMLElement>,
>(base: T): T & HTMLElementConstructor<StorageFormChildAreaHandlerElement> {
  return class extends mixinAreaHandlerElement(base) {
    #storageForm: StorageElementMixin | null = null;
    // Unlike isConnected, this is false in attributeChangedCallback called
    // before connectedCallback.
    #isReady = false;
    private readonly storageFormObserver = new MutationObserver(
      this.onStorageFormMutation.bind(this),
    );
    private readonly allCustomElementsDefinedListener = () => {
      this.updateStorageForm();
    };

    get storageForm() {
      return this.#storageForm;
    }

    get storageArea() {
      const a = super.storageArea;
      return a === "" && this.storageForm !== null
        ? this.storageForm.storageArea
        : a;
    }
    set storageArea(v: string) {
      super.storageArea = v;
    }

    /** Called if storage-area of the form or forms without it is changed. */
    private onStorageFormMutation(records: MutationRecord[]) {
      const isChanged = this.findStorageForm();
      if (isChanged || records.some((r) => r.target === this.#storageForm)) {
        this.updateArea();
        this.invokeStorageChangeCallback();
      }
    }

    connectedCallback() {
      // The super class reads the storage, so the form should be found before
      // it to avoid showing the value without the area.
      this.findStorageForm();
      super.connectedCallback?.();
      this.#isReady = true;
      allCustomElementsDefinedEvent.listeners.add(
        this.allCustomElementsDefinedListener,
      );
    }

    adoptedCallback() {
      super.adoptedCallback?.();
      this.updateStorageForm();
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
      this.storageFormObserver.disconnect();
      this.#storageForm = null;
      this.#isReady = false;
      allCustomElementsDefinedEvent.listeners.delete(
        this.allCustomElementsDefinedListener,
      );
    }

    refreshStorageValue() {
      if (!this.#isReady || this.storageArea === "") return;
      this.invokeStorageChangeCallback();
    }

    //

    private updateStorageForm() {
      if (!this.findStorageForm()) return;
      this.updateArea();
      this.invokeStorageChangeCallback();
    }

    /** @return true if the form is changed. */
    private findStorageForm(): boolean {
      // Elements in shadow trees inherit the area of the host's form.
      const forms = [
        ...storageFormsToClosest(this, { crossShadowRoots: true }),
      ];
      // Forms without storage-area are observed, because the area may be set.
      this.storageFormObserver.disconnect();
      for (const f of forms) {
        this.storageFormObserver.observe(f, {
          attributes: true,
          attributeFilter: ["storage-area"],
        });
      }
      const last = forms.at(-1);
      const form = last?.storageArea ? last : null;
      if (form === this.#storageForm) return false;
      this.#storageForm = form;
      return true;
    }

    private updateArea() {
      this.areaHandler.updateArea(this.storageArea);
    }
  };
}
