import * as ah from "./area-handler";
import HTMLStorageFormElement from "./storage-form";

declare interface ItemElement extends HTMLElement {
  value: string,
  name: string,
  form: HTMLFormElement | null,
  type?: string,
  checked?: boolean;
}

declare interface StorageItemElement extends ItemElement {
  load(): Promise<void>;
  store(): Promise<void>;
  getAreaHandler(): ah.AreaHandler;
  getForm(): HTMLStorageFormElement;
}

export function mixinStorageElement(c: Class<ItemElement>): Class<StorageItemElement> {
  return class extends c {
    constructor() {
      super();
    }

    createdCallback() {
      if (this.name) this.load();
    }

    attachedCallback() {
      this.load();
    }

    async load(): Promise<void> {
      if (!this.name) throw Error("\"name\" attribute are required");

      const v = await this.getAreaHandler().read(this.name);
      this.value = v ? v : "";
    }

    getAreaHandler(): ah.AreaHandler {
      const a: ?ah.Area = this.getArea();
      if (!a) throw Error("\"area\" attribute is required");

      const h = ah.findHandler(a);
      if (!h) throw Error(`Unsupported area: ${a}`);
      return h;
    }

    getArea(): ?ah.Area {
      const a = this.getAttribute("area");
      if (a) return a;

      const fa = this.getForm().getAttribute("area");
      if (fa) return fa;
      return null;
    }

    getForm(): HTMLStorageFormElement {
      const f = this.form;
      if (f instanceof HTMLStorageFormElement) return f;
      throw Error(`'${String(this.getAttribute("is"))}' requires ` +
                  "'<form is=\"storage-form\" ...>' as a parent Node");
    }

    async store(): Promise<void> {
      if (!this.name) throw Error("\"name\" attribute are required");

      await this.getAreaHandler().write(this.name, this.value);
    }

    detachedCallback() {}
  };
}

export const StorageTextAreaElement = mixinStorageElement(HTMLTextAreaElement);
export const StorageSelectElement = mixinStorageElement(HTMLSelectElement);

const MixinedInputElement = mixinStorageElement(HTMLInputElement);
export class StorageInputElement extends MixinedInputElement {

  // DONOT use "async" keyword.
  // Because "async" function transpiler does not support "super".
  load(): Promise<void> {
    if (!this.name) throw Error("\"name\" attribute are required");

    if (this.type === "checkbox") {
      return this.getAreaHandler().read(this.name).then((v) => {
        this.checked = v != null;
        // Update stored value to current checkbox value
        this.store();
      });
    }

    if (this.type === "radio") {
      return this.getAreaHandler().read(this.name).then((v) => {
        this.checked = this.value === v;
      });
    }

    return super.load();
  }

  store(): Promise<void> {
    if (!this.name) throw Error("\"name\" attribute are required");

    if (this.type === "checkbox") {
      if (this.checked) return super.store();
      return this.deleteStore();
    }

    if (this.type === "radio") {
      if (this.checked) return super.store();
      return Promise.resolve();
    }

    return super.store();
  }

  deleteStore(): Promise<void> {
    return this.getAreaHandler().removeItem(this.name);
  }
}
