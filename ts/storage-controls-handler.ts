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
  const h = handlers.get(element.tagName);
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
  const h = handlers.get(element.tagName);
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

registerHandler("INPUT", {
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

registerHandler("SELECT", {
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

registerHandler("TEXTAREA", plainValueHandler);
registerHandler("OUTPUT", plainValueHandler);

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
 * A helper function to create a write function for input types
 * that accept a value that matches the given regexp,
 * otherwise the value is set to fallbackValue.
 *
 * TODO RegExp is not enough to validate the value.
 */
const writeIfRegexpMatch =
  (
    regexp: RegExp,
    options: { fallbackValue?: string } = { fallbackValue: "" },
  ): StorageControlsInputTypeHandler["write"] =>
  (element, value) => {
    if (value === undefined) {
      element.value = element.defaultValue;
    } else if (value.match(regexp)) {
      element.value = value;
    } else {
      element.value = options.fallbackValue ?? "";
    }
  };

registerInputTypeHandler("date", {
  diff: diffIfNoInput,
  write: writeIfRegexpMatch(/^\d{4}-\d{2}-\d{2}$/),
});

registerInputTypeHandler("datetime-local", {
  diff: diffIfNoInput,
  write: writeIfRegexpMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
});

registerInputTypeHandler("month", {
  diff: diffIfNoInput,
  write: writeIfRegexpMatch(/^\d{4}-\d{2}$/),
});

registerInputTypeHandler("time", {
  diff: diffIfNoInput,
  write: writeIfRegexpMatch(/^\d{2}:\d{2}$/),
});

registerInputTypeHandler("week", {
  diff: diffIfNoInput,
  write: writeIfRegexpMatch(/^\d{4}-W\d{2}$/),
});

registerInputTypeHandler("range", {
  // TODO Should not read the value when the value is not set by the user.
  // But there might be no way to detect it.
  diff: diffIfChanged,
  write: writeIfRegexpMatch(/^[-+]?\d+(\.\d+)?$/),
});

registerInputTypeHandler("color", {
  // TODO Should not read the value when the value is not set by the user.
  // But there might be no way to detect it.
  diff: diffIfChanged,
  write: writeIfRegexpMatch(/^#[0-9a-f]{6}$/i, { fallbackValue: "#000000" }),
});

registerInputTypeHandler("number", {
  diff: diffIfChanged,
  write: writeIfRegexpMatch(/^[-+]?\d+(\.\d+)?$/),
});

// Check all input types are registered
for (const t of INPUT_TYPES)
  if (!inputHandlers.has(t))
    throw new Error(`Input type handler for ${t} is not registered`);
