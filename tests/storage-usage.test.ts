import type { StorageFormChildAreaHandlerElement } from "../ts/area-handler-element.js";
import { registerHandler, WebStorageHandler } from "../ts/area-handler.js";
import { allCustomElementsDefinedEvent } from "../ts/globals.js";
import { HTMLStorageFormElement } from "../ts/storage-form.js";
import {
  HTMLStorageQuotaElement,
  HTMLStorageUsageElement,
  HTMLStorageUsageMeterElement,
} from "../ts/storage-usage.js";
import {
  flush,
  input,
  query,
  render,
  updateFromAnotherWindow,
} from "./helpers/dom.js";

registerHandler("small", new WebStorageHandler(localStorage, 10, 100));
registerHandler("no-quota", new WebStorageHandler(localStorage));

HTMLStorageUsageElement.register();
HTMLStorageQuotaElement.register();
HTMLStorageUsageMeterElement.register();
HTMLStorageFormElement.register();

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(async () => {
  await render("");
});

type Usage = HTMLStorageUsageElement & StorageFormChildAreaHandlerElement;
const usage = () => query<Usage>("storage-usage");
const quota = () => query<HTMLStorageQuotaElement>("storage-quota");
const meter = () => query<HTMLStorageUsageMeterElement>("meter");

describe("storage-usage", () => {
  beforeEach(() => {
    localStorage.setItem("foo", "12345");
    localStorage.setItem("bar", "1234567890");
  });

  it.each([
    // [attributes, value, text]
    ["", 15, "15B"],
    ["name=foo", 5, "5B"],
    ["name=none", 0, "0B"],
    ["format=percent", 0.15, "15%"],
    ["format=percent name=foo", 0.5, "50%"],
    ["format=percent name=none", 0, "0%"],
    ["format=''", 15, "15"],
  ])("should show the usage with %p", async (attrs, value, text) => {
    await render(`<storage-usage storage-area=small ${attrs}></storage-usage>`);
    expect(usage().value).toBeCloseTo(value);
    expect(usage().textContent).toBe(text);
  });

  it.each(["", "name=foo"])(
    "should be NaN without the quota with %p",
    async (attrs) => {
      await render(
        `<storage-usage storage-area=no-quota format=percent ${attrs}></storage-usage>`,
      );
      expect(usage().value).toBeNaN();
      expect(usage().textContent).toBe("NaN%");
    },
  );

  it("should follow changes by another window", async () => {
    await render(`<storage-usage storage-area=small name=foo></storage-usage>`);
    await updateFromAnotherWindow(localStorage, "foo", "12");
    expect(usage().textContent).toBe("2B");
  });

  it("should stop after disconnected", async () => {
    await render(`<storage-usage storage-area=small name=foo></storage-usage>`);
    const e = usage();
    e.remove();
    await updateFromAnotherWindow(localStorage, "foo", "12");
    expect(e.textContent).toBe("5B");
  });

  it("should not leave listeners after disconnected", async () => {
    await render(`<storage-usage storage-area=small></storage-usage>`);
    const { size } = allCustomElementsDefinedEvent.listeners;
    const e = usage();
    for (let i = 0; i < 5; i++) {
      e.remove();
      expect(allCustomElementsDefinedEvent.listeners.size).toBe(size - 1);
      document.body.append(e);
      expect(allCustomElementsDefinedEvent.listeners.size).toBe(size);
    }
  });

  describe("in storage-form", () => {
    it("should use the area of the form", async () => {
      await render(`
        <storage-form storage-area="small">
          <input name="foo"><div><storage-usage name="foo"></storage-usage></div>
        </storage-form>`);
      expect(usage().storageForm).toBe(query("storage-form"));
      expect(usage().storageArea).toBe("small");
      expect(usage().textContent).toBe("5B");
      await input(query("input"), "1234567");
      expect(usage().textContent).toBe("7B");
    });

    it("should prefer its own area", async () => {
      sessionStorage.setItem("foo", "1");
      await render(`
        <storage-form storage-area="small">
          <storage-usage name="foo" storage-area="session-storage"></storage-usage>
        </storage-form>`);
      expect(usage().textContent).toBe("1B");
    });

    it("should follow the area change of the form", async () => {
      sessionStorage.setItem("foo", "1");
      await render(`
        <storage-form storage-area="small">
          <storage-usage name="foo"></storage-usage>
        </storage-form>`);
      query<HTMLStorageFormElement>("storage-form").storageArea =
        "session-storage";
      await flush();
      expect(usage().textContent).toBe("1B");
    });

    it("should find the form beyond the shadow root", async () => {
      await render(
        `<storage-form storage-area="small"><div></div></storage-form>`,
      );
      const root = query("div").attachShadow({ mode: "open" });
      root.innerHTML = `<storage-usage name="foo"></storage-usage>`;
      await flush();
      expect(root.textContent).toBe("5B");
    });

    it("should find the form after all elements are defined", async () => {
      await render(
        `<storage-form><storage-usage name="foo"></storage-usage></storage-form>`,
      );
      expect(usage().storageForm).toBeNull();
      query<HTMLStorageFormElement>("storage-form").storageArea = "small";
      allCustomElementsDefinedEvent.dispatchEvent();
      await flush();
      expect(usage().textContent).toBe("5B");
    });

    it("should find the form after all elements are defined even if reconnected", async () => {
      await render(
        `<storage-form><storage-usage name="foo"></storage-usage></storage-form>`,
      );
      const form = query<HTMLStorageFormElement>("storage-form");
      const e = usage();
      e.remove();
      form.append(e);
      form.storageArea = "small";
      allCustomElementsDefinedEvent.dispatchEvent();
      await flush();
      expect(e.textContent).toBe("5B");
    });

    it("should follow the form after reconnected", async () => {
      sessionStorage.setItem("foo", "1");
      await render(`
        <storage-form storage-area="small">
          <storage-usage name="foo"></storage-usage>
        </storage-form>`);
      const form = query<HTMLStorageFormElement>("storage-form");
      const e = usage();
      e.remove();
      form.append(e);
      await flush();
      form.storageArea = "session-storage";
      await flush();
      expect(e.textContent).toBe("1B");
    });

    it("should follow the area change of the form while disconnected", async () => {
      sessionStorage.setItem("foo", "1");
      await render(`
        <storage-form storage-area="small">
          <storage-usage name="foo"></storage-usage>
        </storage-form>`);
      const form = query<HTMLStorageFormElement>("storage-form");
      const e = usage();
      e.remove();
      form.storageArea = "session-storage";
      await flush();
      expect(e.textContent).toBe("5B");
      form.append(e);
      await flush();
      expect(e.textContent).toBe("1B");
    });

    it("should follow only the new form after moved", async () => {
      sessionStorage.setItem("foo", "1");
      await render(`
        <storage-form id="old" storage-area="small">
          <storage-usage name="foo"></storage-usage>
        </storage-form>
        <storage-form id="new" storage-area="session-storage"></storage-form>`);
      const oldForm = query<HTMLStorageFormElement>("#old");
      const newForm = query<HTMLStorageFormElement>("#new");
      const e = usage();
      newForm.append(e);
      await flush();
      expect(e.storageForm).toBe(newForm);
      expect(e.textContent).toBe("1B");

      const updateArea = jest.spyOn(e.areaHandler, "updateArea");
      oldForm.storageArea = "session-storage";
      await flush();
      expect(updateArea).not.toHaveBeenCalled();
      newForm.storageArea = "small";
      await flush();
      expect(e.textContent).toBe("5B");
    });

    it("should follow only the nearest form after all elements are defined", async () => {
      await render(`
        <storage-form id="outer" storage-area="session-storage">
          <storage-form id="inner">
            <storage-usage name="foo"></storage-usage>
          </storage-form>
        </storage-form>`);
      const outer = query<HTMLStorageFormElement>("#outer");
      const inner = query<HTMLStorageFormElement>("#inner");
      const e = usage();
      expect(e.storageForm).toBe(outer);
      inner.storageArea = "small";
      allCustomElementsDefinedEvent.dispatchEvent();
      await flush();
      expect(e.storageForm).toBe(inner);
      expect(e.textContent).toBe("5B");

      const updateArea = jest.spyOn(e.areaHandler, "updateArea");
      outer.storageArea = "small";
      await flush();
      expect(updateArea).not.toHaveBeenCalled();
    });

    it("should not follow the form after moved out of it", async () => {
      await render(`
        <storage-form storage-area="small">
          <storage-usage name="foo"></storage-usage>
        </storage-form>`);
      const form = query<HTMLStorageFormElement>("storage-form");
      const e = usage();
      document.body.append(e);
      await flush();
      expect(e.storageForm).toBeNull();
      expect(e.storageArea).toBe("");
      expect(e.textContent).toBe("0B");

      const updateArea = jest.spyOn(e.areaHandler, "updateArea");
      form.storageArea = "session-storage";
      await flush();
      expect(updateArea).not.toHaveBeenCalled();
    });

    it("should use the area of the form after its own area is removed while disconnected", async () => {
      sessionStorage.setItem("foo", "1");
      await render(`
        <storage-form storage-area="small">
          <storage-usage name="foo" storage-area="session-storage"></storage-usage>
        </storage-form>`);
      const form = query<HTMLStorageFormElement>("storage-form");
      const e = usage();
      e.remove();
      e.removeAttribute("storage-area");
      form.append(e);
      await flush();
      expect(e.textContent).toBe("5B");
    });

    it("should use its own area set while disconnected", async () => {
      sessionStorage.setItem("foo", "1");
      await render(`
        <storage-form storage-area="small">
          <storage-usage name="foo"></storage-usage>
        </storage-form>`);
      const form = query<HTMLStorageFormElement>("storage-form");
      const e = usage();
      e.remove();
      e.setAttribute("storage-area", "session-storage");
      form.append(e);
      await flush();
      expect(e.textContent).toBe("1B");
      form.storageArea = "local-storage";
      await flush();
      expect(e.textContent).toBe("1B");
    });

    it("should not show the value without the area when reconnected", async () => {
      await render(`
        <storage-form storage-area="small">
          <storage-usage name="foo"></storage-usage>
        </storage-form>`);
      const form = query<HTMLStorageFormElement>("storage-form");
      const e = usage();
      const values: number[] = [];
      const { value } = e;
      Object.defineProperty(e, "value", {
        get: () => value,
        set: (v: number) => values.push(v),
      });
      e.remove();
      form.append(e);
      await flush();
      expect(new Set(values)).toEqual(new Set([5]));
    });
  });
});

describe("formatted number", () => {
  it.each([
    [0, "0B"],
    [1, "1B"],
    [1023, "1,023B"],
    [1024, "1KiB"],
    [1536, "1.5KiB"],
    [1024 ** 2, "1MiB"],
    [1024 ** 3 * 1.234, "1.23GiB"],
    [NaN, "NaN"],
  ])("should format %d as bytes", async (value, text) => {
    await render(`<storage-usage></storage-usage>`);
    usage().value = value;
    expect(usage().textContent).toBe(text);
  });

  it("should change the format", async () => {
    await render(`<storage-usage></storage-usage>`);
    usage().value = 0.1234;
    usage().format = "percent";
    expect(usage().getAttribute("format")).toBe("percent");
    expect(usage().textContent).toBe("12.3%");
  });

  it("should warn and use the default format if it is unknown", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation();
    await render(`<storage-usage></storage-usage>`);
    usage().format = "unknown";
    usage().value = 1234;
    expect(usage().textContent).toBe("1,234");
    expect(warn).toHaveBeenCalledWith("unknown format", "unknown");
  });

  it("should update the value by the attribute", async () => {
    await render(`<storage-usage></storage-usage>`);
    const listener = jest.fn();
    usage().addEventListener("change", listener);
    usage().setAttribute("value", "2048");
    expect(usage().value).toBe(2048);
    expect(usage().textContent).toBe("2KiB");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("should warn and be 0 if the value attribute is not a number", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation();
    await render(`<storage-usage></storage-usage>`);
    usage().setAttribute("value", "x");
    expect(usage().value).toBe(0);
    expect(warn).toHaveBeenCalledWith(expect.any(String), "x");
  });

  it("should reflect name property to the attribute", async () => {
    await render(`<storage-usage></storage-usage>`);
    expect(usage().name).toBe("");
    usage().name = "foo";
    expect(usage().getAttribute("name")).toBe("foo");
  });

  // https://github.com/kui/storage-form/issues/45
  it.failing("should show the usage of the new name", async () => {
    localStorage.setItem("foo", "1");
    localStorage.setItem("bar", "123");
    await render(`<storage-usage storage-area=small name=foo></storage-usage>`);
    usage().name = "bar";
    await flush();
    expect(usage().textContent).toBe("3B");
  });
});

describe("storage-quota", () => {
  it.each([
    ["storage-area=small", 100, "100B"],
    ["storage-area=small name", 10, "10B"],
    ["storage-area=local-storage", 10 * 1024 ** 2, "10MiB"],
    ["storage-area=no-quota", NaN, "NaN"],
    ["storage-area=no-quota name", NaN, "NaN"],
    ["", NaN, "NaN"],
  ])("should show the quota with %p", async (attrs, value, text) => {
    await render(`<storage-quota ${attrs}></storage-quota>`);
    expect(quota().value).toBe(value);
    expect(quota().textContent).toBe(text);
  });
});

describe("storage-usage-meter", () => {
  beforeEach(() => {
    localStorage.setItem("foo", "12345");
    localStorage.setItem("bar", "1234567890");
  });

  it.each([
    ["", 0.15],
    ["name=foo", 0.5],
    ["name=none", 0],
  ])("should show the usage with %p", async (attrs, value) => {
    await render(
      `<meter is="storage-usage-meter" storage-area=small ${attrs}></meter>`,
    );
    expect(meter().value).toBeCloseTo(value);
  });

  it("should have default thresholds", async () => {
    await render(`<meter is="storage-usage-meter" storage-area=small></meter>`);
    expect(meter().high).toBe(0.9);
    expect(meter().low).toBe(0.7);
  });

  it("should keep specified thresholds", async () => {
    await render(
      `<meter is="storage-usage-meter" storage-area=small high=0.5 low=0.1></meter>`,
    );
    expect(meter().high).toBe(0.5);
    expect(meter().low).toBe(0.1);
  });

  it("should follow changes by another window", async () => {
    await render(
      `<meter is="storage-usage-meter" storage-area=small name=foo></meter>`,
    );
    await updateFromAnotherWindow(localStorage, "foo", "12");
    expect(meter().value).toBeCloseTo(0.2);
  });

  it("should dispatch a change event on the name change", async () => {
    await render(`<meter is="storage-usage-meter" storage-area=small></meter>`);
    const listener = jest.fn();
    meter().addEventListener("change", listener);
    (meter() as HTMLMeterElement & { name: string }).name = "foo";
    expect(meter().getAttribute("name")).toBe("foo");
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
