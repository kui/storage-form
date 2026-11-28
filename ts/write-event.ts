// Imports nothing, so that the users of this type do not need the types of
// the storages, such as chrome.

export const WRITE_EVENT_TYPE = "storage-form-write";

export interface StorageFormWriteEventDetail {
  /**
   * Names written to the storage. Empty if the write failed, even if some of
   * them were written.
   */
  written: string[];
  /**
   * Names not written, because their controls are invalid. A storage form
   * reports a skipped name again on each later edit in the form, until its
   * value is stored, restored or overwritten.
   */
  skipped: string[];
  /** Set if the write failed. */
  error?: unknown;
}

export type StorageFormWriteEvent = CustomEvent<StorageFormWriteEventDetail>;

declare global {
  // Extended by the event maps of HTMLElement, Document and Window.
  interface GlobalEventHandlersEventMap {
    [WRITE_EVENT_TYPE]: StorageFormWriteEvent;
  }
}

export function dispatchWriteEvent(
  element: EventTarget,
  detail: StorageFormWriteEventDetail,
) {
  element.dispatchEvent(
    new CustomEvent(WRITE_EVENT_TYPE, { bubbles: true, detail }),
  );
}
