import HTMLStorageFormElement from "./storage-form";

declare interface ItemElement extends HTMLElement {
  value: string,
  name: string,
  form: HTMLFormElement | null,
  type?: string,
  checked?: boolean;
}

export function mixinStorageItem(c: Class<ItemElement>): Class<ItemElement> {
  return class extends c {
    constructor() {
      super();
    }

    attachedCallback() {
      if (this.form instanceof HTMLStorageFormElement) {
        this.form.scanFormComponents();
      } else {
        console.error("<%s is=%o> must be attached into <form is=\"storage-form\">",
                      this.tagName.toLowerCase(), this.getAttribute("is"));
      }
    }
  };
}

export const StorageTextAreaElement = mixinStorageItem(HTMLTextAreaElement);
export const StorageSelectElement = mixinStorageItem(HTMLSelectElement);
export const StorageInputElement = mixinStorageItem(HTMLInputElement);
