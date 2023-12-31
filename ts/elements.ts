export interface ValueContainer<V> {
  name: string;
  value: V;
}
export type ValueContainerElement<
  V = string,
  C extends ValueContainer<V> = ValueContainer<V>,
> = HTMLElement & C;

export interface FormatedNumericValueElement
  extends ValueContainerElement<number> {
  format: string;
}

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

export function updateValue<C extends ValueContainer<V>, V = string>(
  element: EventTarget & C,
  newValue: C["value"],
) {
  if (element.value === newValue) return;
  element.value = newValue;
  dispatchChangeEvent(element);
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
  isNotStorageControl: boolean;
}
export interface StorageElementMixin extends HTMLElement {
  storageArea: string;
}
