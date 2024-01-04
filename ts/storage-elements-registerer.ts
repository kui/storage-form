import { allCustomElementsDefinedEvent } from "./globals.js";
import {
  HTMLAreaSelectElement,
  HTMLStorageAreaSelectElement,
} from "./storage-area-select.js";
import { HTMLStorageFormElement } from "./storage-form.js";
import {
  HTMLStorageInputElement,
  HTMLStorageSelectElement,
  HTMLStorageTextAreaElement,
  HTMLStorageOutputElement,
} from "./storage-mono-controls.js";
import {
  HTMLStorageQuotaElement,
  HTMLStorageUsageElement,
  HTMLStorageUsageMeterElement,
} from "./storage-usage.js";

/**
 * Registers all custom elements defined in this package.
 */
export function register(): void {
  HTMLStorageInputElement.register();
  HTMLStorageSelectElement.register();
  HTMLStorageTextAreaElement.register();
  HTMLStorageOutputElement.register();
  HTMLAreaSelectElement.register();
  HTMLStorageAreaSelectElement.register();
  HTMLStorageUsageElement.register();
  HTMLStorageUsageMeterElement.register();
  HTMLStorageQuotaElement.register();
  HTMLStorageFormElement.register();
  allCustomElementsDefinedEvent.dispatchEvent();
}
