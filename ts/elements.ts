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

function isStorageForm(e: Element): e is StorageFormElement {
  return (e as Partial<StorageFormElement>)[storageFormMarker] === true;
}

/**
 * Yields the ancestor storage forms from the nearest, until the one with
 * storage-area. Forms without storage-area are skipped as owners, but yielded
 * because setting their storage-area changes the owner.
 *
 * @param crossShadowRoots Whether to look for forms beyond shadow hosts.
 */
export function* storageFormsToClosest(
  element: Element,
  { crossShadowRoots }: { crossShadowRoots: boolean },
): Generator<StorageFormElement, void, undefined> {
  const parentOf = crossShadowRoots
    ? parentOrShadowRootHost
    : (e: Element) => e.parentElement;
  for (let p = parentOf(element); p !== null; p = parentOf(p)) {
    if (!isStorageForm(p)) continue;
    yield p;
    if (p.storageArea) return;
  }
}

/** The nearest ancestor storage form with storage-area. */
export function closestStorageForm(
  element: Element,
  options: { crossShadowRoots: boolean },
): StorageFormElement | null {
  for (const form of storageFormsToClosest(element, options))
    if (form.storageArea) return form;
  return null;
}
