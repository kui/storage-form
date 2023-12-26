import { HTMLStorageFormElement } from "./storage-form.js";
import {
  HTMLStorageInputElement,
  HTMLStorageSelectElement,
  HTMLStorageTextAreaElement,
  HTMLStorageOutputElement,
} from "./storage-mono-controls.js";
import { HTMLAreaSelectElement, HTMLStorageAreaSelectElement } from "./storage-area-select.js";

/**
 * Registers all custom elements defined in this package.
 */
export function register(): void {
  HTMLStorageFormElement.register();
  HTMLStorageInputElement.register();
  HTMLStorageSelectElement.register();
  HTMLStorageTextAreaElement.register();
  HTMLStorageOutputElement.register();
  HTMLAreaSelectElement.register();
  HTMLStorageAreaSelectElement.register();
}
