import { register } from "../ts/storage-elements-registerer.js";
import { flush, input, query } from "./helpers/dom.js";

describe("register", () => {
  it("should define all elements and upgrade existing ones", async () => {
    localStorage.setItem("area", "session-storage");
    sessionStorage.setItem("foo", "stored");
    document.body.innerHTML = `
      <storage-form>
        <select is="storage-area-select" name="area" storage-area="local-storage"></select>
        <input name="foo">
        <storage-usage name="foo"></storage-usage>
      </storage-form>
      <input is="storage-input" name="foo" storage-area="session-storage">`;
    register();

    expect(
      [
        "storage-input",
        "storage-select",
        "storage-textarea",
        "storage-output",
        "area-select",
        "storage-area-select",
        "storage-usage",
        "storage-usage-meter",
        "storage-quota",
        "storage-form",
      ].filter((name) => customElements.get(name) === undefined),
    ).toEqual([]);

    await flush();
    await flush();
    expect(query<HTMLSelectElement>("select").value).toBe("session-storage");
    expect(query<HTMLInputElement>("input[name=foo]").value).toBe("stored");
    expect(query<HTMLInputElement>("[is=storage-input]").value).toBe("stored");
    expect(query("storage-usage").textContent).toBe("6B");

    await input(query("input[name=foo]"), "typed!!!");
    expect(sessionStorage.getItem("foo")).toBe("typed!!!");
    expect(query<HTMLInputElement>("[is=storage-input]").value).toBe(
      "typed!!!",
    );
    expect(query("storage-usage").textContent).toBe("8B");
  });

  it("should throw an error if it is called twice", () => {
    expect(() => {
      register();
    }).toThrow();
  });
});
