import { AreaHandler, FacadeAreaHandler } from "./area-handler.js";
import type { StorageUsageMixin } from "./elements.js";

type HTMLElementConstructor<T extends HTMLElement> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]) => T;

export function mixinStorageUsageElement<
  T extends HTMLElementConstructor<HTMLElement>,
>(base: T): T & HTMLElementConstructor<StorageUsageMixin> {
  return class extends base {
    readonly storageUsage = true;
    private readonly areaHandler = new FacadeAreaHandler();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    constructor(..._args: any[]) {
      super();
      this.areaHandler.onChange(() => this.update());
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
      return this.getAttribute("storage-area") ?? "";
    }
    set storageArea(v: string) {
      this.setAttribute("storage-area", v);
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
      this.areaHandler.updateArea(this.storageArea);
      this.update().catch(console.error);
    }

    adoptedCallback() {
      super.adoptedCallback?.();
      this.update().catch(console.error);
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
  if (b === 0) return "0 B";
  const unitIndex = Math.floor(Math.log(b) / Math.log(KIBI));
  return `${(b / KIBI ** unitIndex).toPrecision(4)} ${UNITS[unitIndex]}`;
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
