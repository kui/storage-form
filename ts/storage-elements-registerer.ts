import { HTMLStorageFormElement } from "./storage-form.js";
import { HTMLAreaSelectElement } from "./area-select.js";

/**
 * Registers the custom elements defined in this package.
 */
export function register(): void {
  HTMLStorageFormElement.register();
  HTMLAreaSelectElement.register();
}
