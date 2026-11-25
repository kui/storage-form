import type { MaybeValueCheckableElement } from "./elements.js";

interface StorageControlsHandler {
  diff(
    element: HTMLElement,
    oldValue: string | undefined,
  ):
    | { type: "unselected" }
    | { type: "value"; value: string }
    | { type: "nochange" };
  write(element: HTMLElement, value: string | undefined): void;
}

const NOCHANGE = { type: "nochange" } as const;
const UNSELECTED = { type: "unselected" } as const;

/**
 * The key is the tag name of the element.
 */
const handlers = new Map<string, StorageControlsHandler>();

const INPUT_TYPES = [
  "button",
  "checkbox",
  "color",
  "date",
  "datetime-local",
  "email",
  "file",
  "hidden",
  "image",
  "month",
  "number",
  "password",
  "radio",
  "range",
  "reset",
  "search",
  "submit",
  "tel",
  "text",
  "time",
  "url",
  "week",
] as const;

type InputType = (typeof INPUT_TYPES)[number];
const inputHandlers = new Map<InputType, StorageControlsInputTypeHandler>();

export function diff(
  element: HTMLElement,
  oldValue: string | undefined,
):
  | { type: "unselected" }
  | { type: "value"; value: string }
  | { type: "nochange" } {
  const h = handlers.get(element.localName);
  if (!h) {
    console.warn("No handler for %o", element);
    return NOCHANGE;
  }
  return h.diff(element, oldValue);
}

/**
 *
 * @param element Target element
 * @param value if `undefined`, the element is set to the default value.
 */
export function write(
  element: HTMLElement,
  value: string | undefined,
): boolean {
  const h = handlers.get(element.localName);
  if (!h) {
    console.warn("No handler for %o", element);
    return false;
  }
  const { value: oldValue, checked: oldChecked } =
    element as MaybeValueCheckableElement;
  h.write(element, value);
  const { value: newValue, checked: newChecked } =
    element as MaybeValueCheckableElement;
  return oldValue !== newValue || oldChecked !== newChecked;
}

export function reset(element: HTMLElement): boolean {
  return write(element, undefined);
}

function registerHandler(
  tagName: string,
  handler: StorageControlsHandler,
): void {
  if (handlers.has(tagName))
    throw new Error(`Handler for ${tagName} already exists`);
  handlers.set(tagName, handler);
}

registerHandler("input", {
  diff(element: HTMLInputElement, oldValue) {
    const h = inputHandlers.get(element.type as InputType);
    if (h) {
      return h.diff(element, oldValue);
    } else {
      console.warn(`Unknown input type: ${element.type}`);
      return textLikeInputHandler.diff(element, oldValue);
    }
  },
  write(element: HTMLInputElement, value) {
    const h = inputHandlers.get(element.type as InputType);
    if (h) {
      h.write(element, value);
    } else {
      console.warn(`Unknown input type: ${element.type}`);
      textLikeInputHandler.write(element, value);
    }
  },
});

registerHandler("select", {
  diff(element: HTMLSelectElement, oldValue) {
    if (element.selectedIndex < 0) {
      for (const options of element.options) {
        if (options.value === oldValue) return UNSELECTED;
      }
      return NOCHANGE;
    } else {
      return oldValue === element.value
        ? NOCHANGE
        : { type: "value", value: element.value };
    }
  },
  write(element: HTMLSelectElement, value) {
    if (value === undefined) {
      for (const options of element.options)
        options.selected = options.defaultSelected;
    } else {
      element.value = value;
    }
  },
});

const plainValueHandler: StorageControlsHandler = {
  diff(element: HTMLTextAreaElement | HTMLOutputElement, oldValue) {
    return oldValue === element.value
      ? NOCHANGE
      : { type: "value", value: element.value };
  },
  write(element: HTMLTextAreaElement | HTMLOutputElement, value) {
    element.value = value ?? element.defaultValue;
  },
};

registerHandler("textarea", plainValueHandler);
registerHandler("output", plainValueHandler);

///////////////////////////////////////////////////////////////////////
// Input type handlers

interface StorageControlsInputTypeHandler {
  diff(
    element: HTMLInputElement,
    oldValue: string | undefined,
  ):
    | { type: "unselected" }
    | { type: "value"; value: string }
    | { type: "nochange" };
  write(element: HTMLInputElement, value: string | undefined): void;
}

function registerInputTypeHandler(
  type: InputType,
  handler: StorageControlsInputTypeHandler,
) {
  if (inputHandlers.has(type))
    throw new Error(`Input type handler for ${type} already exists`);

  inputHandlers.set(type, handler);
}

/**
 * Basic diff function for input types.
 * If the value is changed, return { type: "value", value: newValue }.
 * Otherwise, return NOCHANGE.
 */
const diffIfChanged: StorageControlsInputTypeHandler["diff"] = (
  element,
  oldValue,
) => {
  return oldValue === element.value
    ? NOCHANGE
    : { type: "value", value: element.value };
};

const textLikeInputHandler: StorageControlsInputTypeHandler = {
  diff: diffIfChanged,
  write(element: HTMLInputElement, value) {
    element.value = value ?? element.defaultValue;
  },
};

for (const t of ["text", "email", "password", "search", "tel", "url"] as const)
  registerInputTypeHandler(t, textLikeInputHandler);

const checkableInputHandler: StorageControlsInputTypeHandler = {
  diff(element: HTMLInputElement, oldValue) {
    if (element.checked) {
      return oldValue === element.value
        ? NOCHANGE
        : { type: "value", value: element.value };
    } else {
      return oldValue === element.value ? UNSELECTED : NOCHANGE;
    }
  },
  write(element: HTMLInputElement, value) {
    if (value === undefined) {
      element.checked = element.defaultChecked;
    } else {
      element.checked = element.value === value;
    }
  },
};

for (const t of ["checkbox", "radio"] as const)
  registerInputTypeHandler(t, checkableInputHandler);

const ignoreInputHandler: StorageControlsInputTypeHandler = {
  diff() {
    return NOCHANGE;
  },
  write() {
    // Do nothing
  },
};

for (const t of ["button", "reset", "submit", "image", "hidden"] as const)
  registerInputTypeHandler(t, ignoreInputHandler);

/**
 * A helper function to create a diff function for input types
 * that reject empty value treated as nochange.
 */
const diffIfNoInput: StorageControlsInputTypeHandler["diff"] = (
  element,
  oldValue,
) => {
  if (element.value === "") return NOCHANGE;
  if (element.value === oldValue) return NOCHANGE;
  return { type: "value" as const, value: element.value };
};

registerInputTypeHandler("file", {
  diff: diffIfNoInput,
  write(element: HTMLInputElement, value) {
    // For security reasons, the value of a file input cannot be set except empty.
    if (element.value !== value) {
      element.value = "";
    }
  },
});

/**
 * The last written value of each input and what the input made of it.
 */
const sanitizedValues = new WeakMap<
  HTMLInputElement,
  { written: string; sanitized: string }
>();

/**
 * A helper function to create a handler for input types
 * of which values are sanitized by the browser.
 */
const createSanitizedInputHandler = (
  diff: StorageControlsInputTypeHandler["diff"],
): StorageControlsInputTypeHandler => ({
  diff(element, oldValue) {
    // Writing dispatches a change event, so without this check the stored value
    // would be overwritten with the sanitized one just by loading it.
    const last = sanitizedValues.get(element);
    if (last && last.written === oldValue && last.sanitized === element.value) {
      return NOCHANGE;
    }
    return diff(element, oldValue);
  },
  write(element, value) {
    element.value = value ?? element.defaultValue;
    if (value === undefined) {
      sanitizedValues.delete(element);
    } else {
      sanitizedValues.set(element, {
        written: value,
        sanitized: element.value,
      });
    }
  },
});

for (const t of ["date", "datetime-local", "month", "time", "week"] as const)
  registerInputTypeHandler(t, createSanitizedInputHandler(diffIfNoInput));

// TODO Should not read the value when the value is not set by the user.
// But there might be no way to detect it.
for (const t of ["range", "color", "number"] as const)
  registerInputTypeHandler(t, createSanitizedInputHandler(diffIfChanged));

// Check all input types are registered
for (const t of INPUT_TYPES)
  if (!inputHandlers.has(t))
    throw new Error(`Input type handler for ${t} is not registered`);
