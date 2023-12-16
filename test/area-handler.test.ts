import assert from "assert";
import sinon from "sinon";
import { BufferedWriteChromeStorageAreaHandler } from "../src/area-handler";

describe("BufferedWriteChromeStorageAreaHandler", () => {
  describe("#write", () => {
    it("should delay the second writing", async () => {
      const spyset = sinon.spy((item, callback) => {
        callback();
      });
      const handler = new BufferedWriteChromeStorageAreaHandler({
        set: spyset,
        MAX_WRITE_OPERATIONS_PER_HOUR: 14400
      });

      const start = Date.now();
      await handler.write({ n1: "v1" });
      const firstElapsedMillis = Date.now() - start;
      handler.write({ n2: "v2" });
      await handler.write({ n3: "v3" });
      const secondElapsedMillis = Date.now() - start;

      console.log("firstElapsedMillis:", firstElapsedMillis);
      console.log("secondElapsedMillis:", secondElapsedMillis);

      assert(firstElapsedMillis < 100);
      assert(secondElapsedMillis > 250);

      assert.equal(spyset.callCount, 2);

      const [firstItems] = spyset.args[0];
      assert.equal(Object.keys(firstItems).length, 1);
      assert.equal(firstItems["n1"], "v1");

      const [secondItems] = spyset.args[1];
      assert.equal(Object.keys(secondItems).length, 2);
      assert.equal(secondItems["n2"], "v2");
      assert.equal(secondItems["n3"], "v3");
    });
  });
});
