export interface ValueContainer<V> {
  name: string;
  value: V;
}
export type ValueContainerElement<
  V = string,
  C extends ValueContainer<V> = ValueContainer<V>,
> = HTMLElement & C;

export interface Checkable {
  checked: boolean;
}
export type CheckableElement = HTMLElement & Checkable;

export interface MaybeValueCheckableContainer {
  value?: string;
  checked?: boolean;
}
export type MaybeValueCheckableElement = HTMLElement &
  MaybeValueCheckableContainer;

export interface CustomElementInterface {
  connectedCallback?(): void;
  disconnectedCallback?(): void;
  adoptedCallback?(): void;
  attributeChangedCallback?(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void;
}

export type HTMLElementConstructor<T extends HTMLElement> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (new (...args: any[]) => T & CustomElementInterface) & {
    observedAttributes?: string[];
  };

export function dispatchChangeEvent(...elements: EventTarget[]) {
  for (const element of elements)
    element.dispatchEvent(new Event("change", { bubbles: true }));
}

export function addChangeListeners(
  element: EventTarget,
  onChange: (event: Event) => void | Promise<void>,
): { stop(): void } {
  const listener = (event: Event) => {
    onChange(event)?.catch(console.error);
  };
  element.addEventListener("change", listener);
  element.addEventListener("input", listener);
  return {
    stop: () => {
      element.removeEventListener("change", listener);
      element.removeEventListener("input", listener);
    },
  };
}

/**
 * To prevent the element from being treated as a storage control.
 */
export interface StorageFormLikeElement extends HTMLElement {
  isNotStorageControl: true;
}
export interface StorageElementMixin extends HTMLElement {
  storageArea: string;
}

export function parentOrShadowRootHost(element: Element): HTMLElement | null {
  const parent = element.parentElement;
  if (parent !== null) return parent;
  const shadowRoot = element.getRootNode();
  if (!(shadowRoot instanceof ShadowRoot)) return null;
  const host = shadowRoot.host;
  if (!(host instanceof HTMLElement)) return null;
  return host;
}

export const storageFormMarker = Symbol("storageForm");

export interface StorageFormElement extends StorageElementMixin {
  readonly [storageFormMarker]: true;
}

export function isStorageForm(e: Node): e is StorageFormElement {
  return (e as Partial<StorageFormElement>)[storageFormMarker] === true;
}

/**
 * Finds the nearest ancestor storage form with storage-area, which owns the
 * element.
 *
 * @param crossShadowRoots Whether to look for forms beyond shadow hosts.
 * @returns `forms` are the ancestor forms from the nearest to the owner, or to
 *   the top if no owner. Forms without storage-area are included, because
 *   setting their storage-area changes the owner.
 */
export function findStorageForm(
  element: Element,
  { crossShadowRoots }: { crossShadowRoots: boolean },
): { owner: StorageFormElement | null; forms: StorageFormElement[] } {
  const parentOf = crossShadowRoots
    ? parentOrShadowRootHost
    : (e: Element) => e.parentElement;
  const forms: StorageFormElement[] = [];
  for (let p = parentOf(element); p !== null; p = parentOf(p)) {
    if (!isStorageForm(p)) continue;
    forms.push(p);
    if (p.storageArea) return { owner: p, forms };
  }
  return { owner: null, forms };
}

/** Change events dispatched by storage elements, not by users. */
const ownChangeEvents = new WeakSet<Event>();

export function dispatchOwnChangeEvent(element: EventTarget) {
  const event = new Event("change", { bubbles: true });
  ownChangeEvents.add(event);
  element.dispatchEvent(event);
}

export function isOwnChangeEvent(event: Event): boolean {
  return ownChangeEvents.has(event);
}

/**
 * Calls `callback` once, after the listeners of `event` on its whole
 * propagation path, so that listeners on ancestors, such as ones setting a
 * custom validity, run before it. Must be called while `event` is dispatched.
 */
export function afterPropagation(event: Event, callback: () => void) {
  const end = event.composedPath().at(-1);
  // A listener added to the current target is not called for this dispatch.
  if (!event.bubbles || end === undefined || end === event.currentTarget) {
    callback();
    return;
  }
  let isCalled = false;
  const call = () => {
    if (isCalled) return;
    isCalled = true;
    clearTimeout(timer);
    end.removeEventListener(event.type, listener);
    callback();
  };
  // Not `once`, because a nested dispatch of the same type may reach the end
  // first.
  const listener = (e: Event) => {
    if (e === event) call();
  };
  // Listeners added during a dispatch to the objects later in the path are
  // called after the ones already added.
  end.addEventListener(event.type, listener);
  // The end is not reached if the propagation is stopped.
  const timer = setTimeout(call, 0);
}

export interface ValidatableElement extends HTMLElement {
  readonly willValidate: boolean;
  readonly validity: ValidityState;
}

/** Like `checkValidity()`, without dispatching an `invalid` event. */
export function isValid(element: HTMLElement): boolean {
  const e = element as Partial<ValidatableElement>;
  return e.willValidate !== true || e.validity?.valid !== false;
}

export const WRITE_EVENT_TYPE = "storage-form-write";

export interface StorageFormWriteEventDetail {
  /** Names written to the storage. */
  written: string[];
  /** Names not written, because their controls are invalid. */
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
