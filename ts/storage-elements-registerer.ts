import { HTMLStorageFormElement } from "./storage-form.js";
import { HTMLStorageSelectElement } from "./storage-select.js";
//import { HTMLAreaSelectElement } from "./area-select.js";

/**
 * Registers the custom elements defined in this package.
 */
export function register(): void {
  HTMLStorageFormElement.register();
  HTMLStorageSelectElement.register();
  //HTMLAreaSelectElement.register();
}
