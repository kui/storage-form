import { AreaHandler, FacadeAreaHandler } from "./area-handler.js";
import type { StorageElementMixin, StorageUsageMixin } from "./elements.js";

type HTMLElementConstructor<T extends HTMLElement> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]) => T;

export function mixinStorageUsageElement<
  T extends HTMLElementConstructor<HTMLElement>,
>(base: T): T & HTMLElementConstructor<StorageUsageMixin> {
  return class extends base {
    readonly storageUsage = true;
    private readonly areaHandler = new FacadeAreaHandler();
    #storageForm: StorageElementMixin | null = null;
    private readonly storageFormObserver = new MutationObserver(
      this.onStorageFormChange.bind(this),
    );
    private areaListening: { stop(): void } | null = null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    constructor(..._args: any[]) {
      super();
    }

    get type() {
      return this.getAttribute("type") ?? "";
    }
    set type(v: string) {
      this.setAttribute("type", v);
    }

    get name() {
      return this.getAttribute("name") ?? "";
    }
    set name(v: string) {
      this.setAttribute("name", v);
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

    get storageForm() {
      return this.#storageForm;
    }

    private onStorageFormChange(mutaions: MutationRecord[]) {
      for (const mutaion of mutaions) {
        if (mutaion.type === "attributes") {
          if (mutaion.attributeName === "storage-area") {
            this.areaHandler.updateArea(this.storageArea);
          }
        }
      }
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

    private getStorageForm(): StorageElementMixin | null {
      let parent = this.parentElement;
      while (parent !== null && !(parent as StorageElementMixin).storageArea)
        parent = parent.parentElement;
      return parent === null ? null : (parent as StorageElementMixin);
    }

    private async update() {
      let format;
      if (this.type.length > 0) {
        format = sizeFormats.get(this.type);
      } else if (this.name.length > 0) {
        format = sizeFormats.get(NAMED_DEFAULT_TYPE);
      } else {
        format = sizeFormats.get(DEFAULT_TYPE);
      }
      this.textContent =
        format === undefined
          ? "unknown type"
          : await format(this.name, this.areaHandler);
    }

    connectedCallback() {
      super.connectedCallback?.();
      this.areaListening = this.areaHandler.onChange(() => this.update());
      this.updateStorageForm();
      this.areaHandler.updateArea(this.storageArea);
      this.update().catch(console.error);
    }

    adoptedCallback() {
      super.adoptedCallback?.();
      this.updateStorageForm();
      this.areaHandler.updateArea(this.storageArea);
      this.update().catch(console.error);
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
      this.storageFormObserver.disconnect();
      this.areaListening?.stop();
      this.areaListening = null;
    }

    static readonly observedAttributes = ["type", "name", "storage-area"];

    attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null,
    ) {
      super.attributeChangedCallback?.(name, oldValue, newValue);
      if (name === "name" || name === "type") {
        this.update().catch(console.error);
      } else if (name === "storage-area") {
        this.areaHandler.updateArea(newValue);
      }
    }
  };
}

type Format = (
  name: string,
  areaHandler: AreaHandler,
) => string | Promise<string>;

const sizeFormats = new Map<string, Format>();

const KIBI = 1024;
const UNITS = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
function bytesUnitFormat(b: number) {
  if (b === 0) return "0B";
  const unitIndex = Math.floor(Math.log(b) / Math.log(KIBI));
  const optionalDecimalPrecition = (b / KIBI ** unitIndex)
    .toPrecision(4)
    .replace(/\.0+$/, "");
  return `${optionalDecimalPrecition}${UNITS[unitIndex]}`;
}

const NAMED_DEFAULT_TYPE = "bytes";
sizeFormats.set("bytes", async (name, areaHandler) => {
  if (name.length === 0) return "no-name";
  const sizes = await areaHandler.readBytes([name]);
  return bytesUnitFormat(sizes.get(name) ?? 0);
});
const DEFAULT_TYPE = "total-bytes";
sizeFormats.set("total-bytes", async (_name, areaHandler) =>
  bytesUnitFormat(await areaHandler.readTotalBytes()),
);
sizeFormats.set("quota", (_name, areaHandler) =>
  areaHandler.quotaBytes === undefined
    ? "undefined quota"
    : bytesUnitFormat(areaHandler.quotaBytes),
);
sizeFormats.set("total-quota", (_name, areaHandler) =>
  areaHandler.totalQuotaBytes === undefined
    ? "undefined total-quota"
    : bytesUnitFormat(areaHandler.totalQuotaBytes),
);
sizeFormats.set("byte-percent", async (name, areaHandler) => {
  if (name.length === 0) return "no-name";
  if (areaHandler.quotaBytes === undefined) return "undefined quota";
  const sizes = await areaHandler.readBytes([name]);
  const bytes = sizes.get(name) ?? 0;
  const percentage = bytes / areaHandler.quotaBytes;
  return Intl.NumberFormat(undefined, { style: "percent" }).format(percentage);
});
sizeFormats.set("total-byte-percent", async (_name, areaHandler) => {
  if (areaHandler.totalQuotaBytes === undefined) return "undefined total-quota";
  const bytes = await areaHandler.readTotalBytes();
  const percentage = bytes / areaHandler.totalQuotaBytes;
  return Intl.NumberFormat(undefined, { style: "percent" }).format(percentage);
});

export class HTMLStorageUsageElement extends mixinStorageUsageElement(
  HTMLElement,
) {
  static register() {
    customElements.define("storage-usage", HTMLStorageUsageElement);
  }
}
