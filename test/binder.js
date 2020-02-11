import assert from "assert";
import sinon from "sinon";
import Binder from "../src/binder";

describe("Binder", () => {
  describe("#aToB", () => {
    it("should write all value of 'a' to 'b' on init.", async () => {
      const binder = new Binder({
        a: {
          readAll: sinon.spy(async () => new Map([["n1", "v1"], ["n2", "v2"]])),
          write: sinon.spy(),
        },
        b: {
          readAll: sinon.spy(),
          write: sinon.spy(),
        },
        diff: (oldValue, newValue) =>
          ({ change: { newValue }, isChanged: (oldValue !== newValue) }),
      });

      await binder.aToB();

      assert.equal(binder.handler.a.readAll.callCount, 1);
      assert.equal(binder.handler.b.readAll.callCount, 0);
      assert.equal(binder.handler.a.write.callCount, 0);
      assert.equal(binder.handler.b.write.callCount, 1);

      const args = binder.handler.b.write.args[0];
      const diffs = args[0];
      assert.equal(diffs.size, 2);
      const d1 = diffs.get("n1");
      assert.equal(d1 && d1.newValue, "v1");
      const d2 = diffs.get("n2");
      assert.equal(d2 && d2.newValue, "v2");
    });
    it("should do nothing if no value in 'a'.", async () => {
      const binder = new Binder({
        a: {
          readAll: sinon.spy(async () => new Map),
          write: sinon.spy(),
        },
        b: {
          readAll: sinon.spy(),
          write: sinon.spy(),
        },
        diff: (oldValue, newValue) =>
          ({ change: { newValue }, isChanged: (oldValue !== newValue) }),
      });

      await binder.aToB();

      assert.equal(binder.handler.a.readAll.callCount, 1);
      assert.equal(binder.handler.b.readAll.callCount, 0);
      assert.equal(binder.handler.a.write.callCount, 0);
      assert.equal(binder.handler.b.write.callCount, 0);
    });
    it("should do nothing on second call.", async () => {
      const binder = new Binder({
        a: {
          readAll: sinon.spy(async () => new Map([["n1", "v1"], ["n2", "v2"]])),
          write: sinon.spy(),
        },
        b: {
          readAll: sinon.spy(),
          write: sinon.spy(),
        },
        diff: (oldValue, newValue) =>
          ({ change: { newValue }, isChanged: (oldValue !== newValue) }),
      });


      await binder.aToB();

      assert.equal(binder.handler.a.readAll.callCount, 1);
      assert.equal(binder.handler.b.readAll.callCount, 0);
      assert.equal(binder.handler.a.write.callCount, 0);
      assert.equal(binder.handler.b.write.callCount, 1);

      await binder.aToB();

      assert.equal(binder.handler.a.readAll.callCount, 2);
      assert.equal(binder.handler.b.readAll.callCount, 0);
      assert.equal(binder.handler.a.write.callCount, 0);
      assert.equal(binder.handler.b.write.callCount, 1);
    });
    it("should write twice if provided 'force' on second call.", async () => {
      const binder = new Binder({
        a: {
          readAll: sinon.spy(async () => new Map([["n1", "v1"], ["n2", "v2"]])),
          write: sinon.spy(),
        },
        b: {
          readAll: sinon.spy(),
          write: sinon.spy(),
        },
        diff: (oldValue, newValue) =>
          ({ change: { newValue }, isChanged: (oldValue !== newValue) }),
      });


      await binder.aToB();

      assert.equal(binder.handler.a.readAll.callCount, 1);
      assert.equal(binder.handler.b.readAll.callCount, 0);
      assert.equal(binder.handler.a.write.callCount, 0);
      assert.equal(binder.handler.b.write.callCount, 1);

      await binder.aToB({ force: true });

      assert.equal(binder.handler.a.readAll.callCount, 2);
      assert.equal(binder.handler.b.readAll.callCount, 0);
      assert.equal(binder.handler.a.write.callCount, 0);
      assert.equal(binder.handler.b.write.callCount, 2);
    });
  });
});
