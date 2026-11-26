import { diff, reset, write } from "../ts/storage-controls-handler.js";

const NOCHANGE = { type: "nochange" };
const UNSELECTED = { type: "unselected" };
const value = (v: string) => ({ type: "value", value: v });

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
function create<T extends HTMLElement>(html: string): T {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.firstElementChild as T;
}

function createInput(attrs: string): HTMLInputElement {
  return create(`<input ${attrs}>`);
}

describe.each([
  ["input without type", "<input value=default>"],
  ["text", "<input type=text value=default>"],
  ["email", "<input type=email value=default>"],
  ["password", "<input type=password value=default>"],
  ["search", "<input type=search value=default>"],
  ["tel", "<input type=tel value=default>"],
  ["url", "<input type=url value=default>"],
  ["textarea", "<textarea>default</textarea>"],
  ["output", "<output>default</output>"],
])("text-like: %s", (_, html) => {
  it("should have a diff if the value is changed", () => {
    const e = create<HTMLInputElement>(html);
    expect(diff(e, "default")).toEqual(NOCHANGE);
    expect(diff(e, undefined)).toEqual(value("default"));
    e.value = "new";
    expect(diff(e, "default")).toEqual(value("new"));
    e.value = "";
    expect(diff(e, "default")).toEqual(value(""));
  });

  it("should write and reset the value", () => {
    const e = create<HTMLInputElement>(html);
    expect(write(e, "new")).toBe(true);
    expect(e.value).toBe("new");
    expect(write(e, "new")).toBe(false);
    expect(reset(e)).toBe(true);
    expect(e.value).toBe("default");
    expect(reset(e)).toBe(false);
  });
});

describe.each(["checkbox", "radio"])("checkable: %s", (type) => {
  it.each([
    // [checked, old value, expected]
    [true, "v", NOCHANGE],
    [true, "other", value("v")],
    [true, undefined, value("v")],
    [false, "v", UNSELECTED],
    [false, "other", NOCHANGE],
    [false, undefined, NOCHANGE],
  ])("should diff checked=%p and old=%p", (checked, oldValue, expected) => {
    const e = createInput(`type=${type} value=v`);
    e.checked = checked;
    expect(diff(e, oldValue)).toEqual(expected);
  });

  it("should be checked if the value matches", () => {
    const e = createInput(`type=${type} value=v`);
    expect(write(e, "v")).toBe(true);
    expect(e.checked).toBe(true);
    expect(write(e, "v")).toBe(false);
    expect(write(e, "other")).toBe(true);
    expect(e.checked).toBe(false);
    expect(e.value).toBe("v");
  });

  it("should reset to the default", () => {
    const checked = createInput(`type=${type} value=v checked`);
    checked.checked = false;
    reset(checked);
    expect(checked.checked).toBe(true);

    const unchecked = createInput(`type=${type} value=v`);
    unchecked.checked = true;
    reset(unchecked);
    expect(unchecked.checked).toBe(false);
  });
});

describe.each(["button", "reset", "submit", "image", "hidden"])(
  "ignored: %s",
  (type) => {
    it("should ignore the value", () => {
      const e = createInput(`type=${type} value=v`);
      expect(diff(e, "old")).toEqual(NOCHANGE);
      expect(write(e, "new")).toBe(false);
      expect(e.value).toBe("v");
    });
  },
);

describe.each([
  ["date", "2020-01-02", "2021-12-31", ["2020-1-2", "2020-01-02T00:00"]],
  [
    "datetime-local",
    "2020-01-02T03:04",
    "2021-12-31T23:59",
    ["2020-01-02", "2020-01-02T25:00"],
  ],
  ["month", "2020-01", "2021-12", ["2020", "2020-01-02"]],
  ["time", "03:04", "23:59", ["3:04", "24:00"]],
  ["week", "2020-W01", "2021-W52", ["2020-01", "2020-W1"]],
])("formatted: %s", (type, defaultValue, newValue, invalids) => {
  it("should have a diff if a non-empty value is changed", () => {
    const e = createInput(`type=${type} value=${defaultValue}`);
    expect(diff(e, defaultValue)).toEqual(NOCHANGE);
    e.value = newValue;
    expect(diff(e, defaultValue)).toEqual(value(newValue));
    e.value = "";
    expect(diff(e, defaultValue)).toEqual(NOCHANGE);
  });

  it("should write and reset the value", () => {
    const e = createInput(`type=${type} value=${defaultValue}`);
    expect(write(e, newValue)).toBe(true);
    expect(e.value).toBe(newValue);
    expect(reset(e)).toBe(true);
    expect(e.value).toBe(defaultValue);
  });

  it.each(invalids)("should be empty if %p is written", (invalid) => {
    const e = createInput(`type=${type} value=${defaultValue}`);
    expect(write(e, invalid)).toBe(true);
    expect(e.value).toBe("");
  });
});

describe.each([
  // [type, default, new, value after writing an invalid value]
  ["range", "10", "20", "50"],
  ["number", "10", "-2.5", ""],
  ["color", "#112233", "#aabbcc", "#000000"],
])("without unset detection: %s", (type, defaultValue, newValue, fallback) => {
  it("should have a diff if the value is changed", () => {
    const e = createInput(`type=${type} value=${defaultValue}`);
    expect(diff(e, defaultValue)).toEqual(NOCHANGE);
    expect(diff(e, undefined)).toEqual(value(defaultValue));
    e.value = newValue;
    expect(diff(e, defaultValue)).toEqual(value(newValue));
  });

  it("should write and reset the value", () => {
    const e = createInput(`type=${type} value=${defaultValue}`);
    expect(write(e, newValue)).toBe(true);
    expect(e.value).toBe(newValue);
    expect(reset(e)).toBe(true);
    expect(e.value).toBe(defaultValue);
  });

  it("should fall back if an invalid value is written", () => {
    const e = createInput(`type=${type} value=${defaultValue}`);
    expect(write(e, "invalid")).toBe(true);
    expect(e.value).toBe(fallback);
  });
});

// Seconds without a fraction are covered by e2e because jsdom appends ".000".
describe.each([
  ["date", "12020-01-02"],
  ["datetime-local", "12020-01-02T03:04"],
  ["datetime-local", "2020-01-02T03:04:05.678"],
  ["month", "12020-01"],
  ["time", "03:04:05"],
  ["time", "03:04:05.678"],
  ["week", "12020-W01"],
  ["number", "1e5"],
  ["number", ".5"],
  ["number", "-.5"],
])("valid value: type=%s value=%s", (type, v) => {
  it("should be written as is", () => {
    const e = createInput(`type=${type}`);
    expect(write(e, v)).toBe(true);
    expect(e.value).toBe(v);
    expect(diff(e, v)).toEqual(NOCHANGE);
  });
});

describe.each([
  // [type, stored value, sanitized value, value edited by the user]
  [
    "datetime-local",
    "2020-01-02 03:04",
    "2020-01-02T03:04",
    "2021-12-31T23:59",
  ],
  ["range", "200", "100", "20"],
  ["number", "invalid", "", "20"],
  ["color", "#AABBCC", "#aabbcc", "#112233"],
  ["color", "invalid", "#000000", "#112233"],
])("sanitized value: type=%s value=%s", (type, stored, sanitized, edited) => {
  it("should not have a diff until the value is changed", () => {
    const e = createInput(`type=${type}`);
    write(e, stored);
    expect(e.value).toBe(sanitized);
    expect(diff(e, stored)).toEqual(NOCHANGE);
    e.value = edited;
    expect(diff(e, stored)).toEqual(value(edited));
  });

  it("should have a diff from another stored value", () => {
    const e = createInput(`type=${type}`);
    write(e, stored);
    expect(diff(e, "other")).toEqual(value(sanitized));
  });

  it("should have a diff after reset", () => {
    const e = createInput(`type=${type} value=${edited}`);
    write(e, stored);
    reset(e);
    expect(diff(e, stored)).toEqual(value(edited));
    e.value = sanitized;
    expect(diff(e, stored)).toEqual(value(sanitized));
  });
});

describe("file", () => {
  it("should not have a diff without files", () => {
    expect(diff(createInput("type=file"), "old")).toEqual(NOCHANGE);
  });

  it("should have a diff if another file is selected", () => {
    const e = createInput("type=file");
    Object.defineProperty(e, "value", { value: "C:\\fakepath\\a.txt" });
    expect(diff(e, undefined)).toEqual(value("C:\\fakepath\\a.txt"));
    expect(diff(e, "C:\\fakepath\\a.txt")).toEqual(NOCHANGE);
  });

  it("should not throw an error on writing", () => {
    const e = createInput("type=file");
    expect(write(e, "C:\\fakepath\\a.txt")).toBe(false);
    expect(e.value).toBe("");
  });

  it("should clear the file only if the value is different", () => {
    const e = createInput("type=file");
    let current = "C:\\fakepath\\a.txt";
    Object.defineProperty(e, "value", {
      get: () => current,
      set: (v: string) => {
        current = v;
      },
    });
    expect(write(e, "C:\\fakepath\\a.txt")).toBe(false);
    expect(write(e, "C:\\fakepath\\b.txt")).toBe(true);
    expect(current).toBe("");
  });
});

describe("select", () => {
  function createSelect(): HTMLSelectElement {
    return create("<select><option>a<option selected>b<option>c</select>");
  }

  it("should have a diff if the selection is changed", () => {
    const e = createSelect();
    expect(diff(e, "b")).toEqual(NOCHANGE);
    e.value = "c";
    expect(diff(e, "b")).toEqual(value("c"));
  });

  it("should be unselected only if the old value is in options", () => {
    const e = createSelect();
    e.selectedIndex = -1;
    expect(diff(e, "b")).toEqual(UNSELECTED);
    expect(diff(e, "unknown")).toEqual(NOCHANGE);
    expect(diff(e, undefined)).toEqual(NOCHANGE);
  });

  it("should write and reset the selection", () => {
    const e = createSelect();
    expect(write(e, "c")).toBe(true);
    expect(e.value).toBe("c");
    expect(reset(e)).toBe(true);
    expect(e.value).toBe("b");
  });

  it("should select nothing if the value is not in options", () => {
    const e = createSelect();
    expect(write(e, "unknown")).toBe(true);
    expect(e.selectedIndex).toBe(-1);
  });
});

describe("unsupported elements", () => {
  it("should warn and do nothing", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation();
    const e = document.createElement("div");
    expect(diff(e, "old")).toEqual(NOCHANGE);
    expect(write(e, "new")).toBe(false);
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it("should treat unknown input types as text", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation();
    const e = createInput("value=default");
    Object.defineProperty(e, "type", { value: "unknown" });
    expect(diff(e, "old")).toEqual(value("default"));
    expect(write(e, "new")).toBe(true);
    expect(e.value).toBe("new");
    expect(warn).toHaveBeenCalledTimes(2);
  });
});
