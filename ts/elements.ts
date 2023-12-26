export interface StringValueContainer {
  value: string;
}
export interface NumberValueContainer {
  value: number;
}
export type ValueContainer = StringValueContainer | NumberValueContainer;

export function dispatchChangeEvent(element: EventTarget) {
    element.dispatchEvent(new Event("change", { bubbles: true }));
}

export function updateValue<C extends ValueContainer>(element: EventTarget & C , newValue: C["value"]) {
    if (element.value === newValue) return;
    element.value = newValue;
    dispatchChangeEvent(element);
}
