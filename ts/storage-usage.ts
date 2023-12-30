import type {
  FormatedNumericValueElement,
  StorageElementMixin,
} from "./elements.js";

import { AreaHandler, FacadeAreaHandler } from "./area-handler.js";
import { dispatchChangeEvent } from "./elements.js";

type HTMLElementConstructor<T extends HTMLElement> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]) => T;

export function mixinNumericValueElement<
  T extends HTMLElementConstructor<HTMLElement>,
>(
  base: T,
  { defaultFormat = "" }: { defaultFormat?: string } = {},
): T & HTMLElementConstructor<FormatedNumericValueElement> {
  return class extends base {
    #value = this.defaultValue;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    constructor(..._args: any[]) {
      super();
      this.addEventListener("change", () => {
        this.updateContent();
      });
    }

    get name() {
      return this.getAttribute("name") ?? "";
    }
    set name(v: string) {
      this.setAttribute("name", v);
    }

    get defaultValue() {
      const n = Number(this.getAttribute("value") ?? "0");
      if (Number.isNaN(n)) {
        console.warn(
          "value attribute should be a number",
          this.getAttribute("value"),
        );
        return 0;
      }
      return n;
    }

    get value() {
      return this.#value;
    }
    set value(v: number) {
      this.#value = v;
      this.updateContent();
    }

    get format() {
      return this.getAttribute("format") ?? defaultFormat;
    }
    set format(v: string) {
      this.setAttribute("format", v);
      this.updateContent();
    }

    get formatter(): NumberFormatter {
      const f = numberFormats.get(this.format);
      if (f === undefined) {
        console.warn("unknown format", this.format);
        return DEFAULT_NUMBER_FORMATER;
      }
      return f;
    }

    private updateContent() {
      this.textContent = this.formatter.format(this.value);
    }

    static readonly observedAttributes = ["name", "value", "format"];

    attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null,
    ) {
      super.attributeChangedCallback?.(name, oldValue, newValue);
      if (name === "value") {
        this.value = this.defaultValue;
        dispatchChangeEvent(this);
      } else if (name === "format" || name === "name") {
        this.updateContent();
        dispatchChangeEvent(this);
      }
    }
  };
}

interface NumberFormatter {
  format(value: number): string;
}
const DEFAULT_NUMBER_FORMATER = new Intl.NumberFormat();
const numberFormats = new Map<string, NumberFormatter>();
numberFormats.set("", new Intl.NumberFormat());
numberFormats.set(
  "percent",
  new Intl.NumberFormat(undefined, {
    style: "percent",
    maximumFractionDigits: 1,
  }),
);
numberFormats.set("bytes", { format: bytesUnitFormat });

const KIBI = 1024;
const UNITS = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
function bytesUnitFormat(bytes: number) {
  if (isNaN(bytes)) return String(NaN);
  if (bytes === 0) return "0B";
  const unitIndex = Math.floor(Math.log(bytes) / Math.log(KIBI));
  const format = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
  });
  return `${format.format(bytes / KIBI ** unitIndex)}${UNITS[unitIndex]}`;
}

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

export function mixinStorageUsageMeterElement<
  T extends HTMLElementConstructor<HTMLMeterElement>,
>(base: T): T {
  const namedMeter = class extends base {
    get name() {
      return this.getAttribute("name") ?? "";
    }
    set name(v: string) {
      this.setAttribute("name", v);
    }

    static readonly observedAttributes = ["name"];

    attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null,
    ) {
      super.attributeChangedCallback?.(name, oldValue, newValue);
      if (name === "name") {
        dispatchChangeEvent(this);
      }
    }
  };
  return class extends mixinAreaHandlerElement(namedMeter) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    constructor(..._args: any[]) {
      super();
      if (!this.hasAttribute("high")) this.high = 0.9;
      if (!this.hasAttribute("low")) this.low = 0.7;
    }

    protected async handleChange() {
      if (this.hasAttribute("name")) {
        this.value = await usagePercentage(this.areaHandler, this.name);
      } else {
        this.value = await usageTotalPercentage(this.areaHandler);
      }
    }
  };
}

async function usagePercentage(areaHandler: AreaHandler, name: string) {
  const sizes = await areaHandler.readBytes([name]);
  const bytes = sizes.get(name) ?? 0;
  const quota = areaHandler.quotaBytes ?? NaN;
  return bytes / quota;
}

async function usageTotalPercentage(areaHandler: AreaHandler) {
  const bytes = await areaHandler.readTotalBytes();
  const quota = areaHandler.totalQuotaBytes ?? NaN;
  return bytes / quota;
}

export class HTMLStorageUsageMeterElement extends mixinStorageUsageMeterElement(
  HTMLMeterElement,
) {
  static register() {
    customElements.define("storage-usage-meter", HTMLStorageUsageMeterElement, {
      extends: "meter",
    });
  }
}

export function mixinStorageUsageElement<
  T extends HTMLElementConstructor<FormatedNumericValueElement>,
>(base: T): T {
  return class extends mixinAreaHandlerElement(base) {
    protected async handleChange() {
      if (this.hasAttribute("name")) {
        if (this.format === "percent") {
          this.value = await usagePercentage(this.areaHandler, this.name);
        } else {
          const sizes = await this.areaHandler.readBytes([this.name]);
          this.value = sizes.get(this.name) ?? 0;
        }
      } else {
        if (this.format === "percent") {
          this.value = await usageTotalPercentage(this.areaHandler);
        } else {
          this.value = await this.areaHandler.readTotalBytes();
        }
      }
    }
  };
}

export class HTMLStorageUsageElement extends mixinStorageUsageElement(
  mixinNumericValueElement(HTMLElement, { defaultFormat: "bytes" }),
) {
  static register() {
    customElements.define("storage-usage", HTMLStorageUsageElement);
  }
}

export function mixinStorageQuotaElement<
  T extends HTMLElementConstructor<FormatedNumericValueElement>,
>(base: T): T {
  return class extends mixinAreaHandlerElement(base) {
    protected handleChange() {
      if (this.hasAttribute("name")) {
        this.value = this.areaHandler.quotaBytes ?? NaN;
      } else {
        this.value = this.areaHandler.totalQuotaBytes ?? NaN;
      }
    }
  };
}

export class HTMLStorageQuotaElement extends mixinStorageQuotaElement(
  mixinNumericValueElement(HTMLElement, { defaultFormat: "bytes" }),
) {
  static register() {
    customElements.define("storage-quota", HTMLStorageQuotaElement);
  }
}
