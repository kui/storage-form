import assert from "assert";
import sinon from "sinon";
import Binder from "../src/binder";

describe("Binder", () => {
  describe("#sync", () => {
    it("should sync the values preferentially to stored values at first.", async () => {
      const elem1 = { name: "n1" };
      const elem2 = { name: "n2" };
      const elem3 = { name: "n3" };
      const storage: Map<string, string> = new Map([
        [elem1.name, "this value should overwrite the form value"],
        // [elem2.name, ""],
        [elem3.name, "ignored"],
      ]);
      const forms: Map<{ name: string}, string> = new Map([
        [elem1, "this value should be overwrited by stored value"],
        [elem2, "this value should be stored"],
        // [elem3, ""],
      ]);
      const storageHandler = {
        write: sinon.spy(async (n, v) => storage.set(n, v)),
        read: sinon.spy(async (n) => storage.get(n)),
        remove: sinon.spy(async (n) => storage.delete(n)),
      };
      const formHandler = {
        write: sinon.spy((e, v) => forms.set(e, v)),
        read: sinon.spy((e) => forms.get(e)),
      };

      const binder = new Binder(storageHandler, formHandler);
      await binder.sync([elem1, elem2]);

      assert.equal(forms.get(elem1), storage.get(elem1.name));
      assert.equal(forms.get(elem2), storage.get(elem2.name));
    });
    it("should write changed form values or remove", async () => {
      const elem1 = { name: "n1" };
      const elem2 = { name: "n2" };
      const storage: Map<string, string> = new Map([
        [elem1.name, "this entry should be removed"],
        [elem2.name, "this value should be overwrited after first sync"],
      ]);
      const forms: Map<{ name: string}, ?string> = new Map([
        [elem1, "this value should be overwrited by stored value"],
        [elem2, "this value should be overwrited by stored value"],
      ]);
      const storageHandler = {
        write: sinon.spy(async (n, v) => storage.set(n, v)),
        read: sinon.spy(async (n) => storage.get(n)),
        remove: sinon.spy(async (n) => storage.delete(n)),
      };
      const formHandler = {
        write: sinon.spy((e, v) => forms.set(e, v)),
        read: sinon.spy((e) => forms.get(e)),
      };

      const binder = new Binder(storageHandler, formHandler);
      await binder.sync([elem1, elem2]);

      assert.equal(forms.get(elem1), storage.get(elem1.name));

      // edit some input such as unchecking a checkbox
      forms.set(elem1, null);
      forms.set(elem2, "this value should overwrite the storage value");

      await binder.sync([elem1, elem2]);

      assert.equal(storage.has(elem1.name), false);
      assert.equal(storage.get(elem2.name), forms.get(elem2));
    });
  });
  describe("#submit", () => {
    it("should abort stored value changing", async () => {
      const elem1 = { name: "n1" };
      const storage: Map<string, string> = new Map([
        [elem1.name, "this entry should be overwrited at belowing new storage value"],
      ]);
      const forms: Map<{ name: string}, ?string> = new Map([
        [elem1, "this value should be overwrited by stored value"],
      ]);
      const storageHandler = {
        write: sinon.spy(async (n, v) => storage.set(n, v)),
        read: sinon.spy(async (n) => storage.get(n)),
        remove: sinon.spy(async (n) => storage.delete(n)),
      };
      const formHandler = {
        write: sinon.spy((e, v) => forms.set(e, v)),
        read: sinon.spy((e) => forms.get(e)),
      };

      const binder = new Binder(storageHandler, formHandler);
      await binder.sync([elem1]);

      assert.equal(forms.get(elem1), storage.get(elem1.name));

      // edit some input
      const newValue = "this value shoud overwrite";
      forms.set(elem1, newValue);
      // change storage value too
      storage.set(elem1.name, "this value should be overwrite by new form value");

      await binder.submit([elem1]);

      assert.equal(storage.get(elem1.name), newValue);
      assert.equal(forms.get(elem1), newValue);
    });
  });
  describe("#scan", () => {
    it("should abort form value changing", async () => {
      const elem1 = { name: "n1" };
      const storage: Map<string, string> = new Map([
        [elem1.name, "this entry should be overwrited at belowing new storage value"],
      ]);
      const forms: Map<{ name: string}, ?string> = new Map([
        [elem1, "this value should be overwrited by stored value"],
      ]);
      const storageHandler = {
        write: sinon.spy(async (n, v) => storage.set(n, v)),
        read: sinon.spy(async (n) => storage.get(n)),
        remove: sinon.spy(async (n) => storage.delete(n)),
      };
      const formHandler = {
        write: sinon.spy((e, v) => forms.set(e, v)),
        read: sinon.spy((e) => forms.get(e)),
      };

      const binder = new Binder(storageHandler, formHandler);
      await binder.sync([elem1]);

      assert.equal(forms.get(elem1), storage.get(elem1.name));

      // edit some input
      const newValue = "this value shoud be aborted";
      forms.set(elem1, newValue);

      await binder.scan([elem1]);

      assert.notEqual(storage.get(elem1.name), newValue);
      assert.equal(forms.get(elem1), newValue);
    });
  });
  describe("#remove", () => {
    it("should remove an entry", async () => {
      const elem1 = { name: "n1" };
      const storage: Map<string, string> = new Map([
        [elem1.name, "this value should overwrite"],
      ]);
      const forms: Map<{ name: string}, ?string> = new Map([
        [elem1, "this value should be overwrited by stored value"],
      ]);
      const storageHandler = {
        write: sinon.spy(async (n, v) => storage.set(n, v)),
        read: sinon.spy(async (n) => storage.get(n)),
        remove: sinon.spy(async (n) => storage.delete(n)),
      };
      const formHandler = {
        write: sinon.spy((e, v) => forms.set(e, v)),
        read: sinon.spy((e) => forms.get(e)),
      };

      const binder = new Binder(storageHandler, formHandler);
      await binder.sync([elem1]);
      assert.equal(binder.v.size, 1);
      await binder.remove([elem1]);
      assert.equal(binder.v.size, 0);
    });
  });
});
