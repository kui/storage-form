import assert from "assert";
import sinon from "sinon";
import { BufferedWriteChromeStorageAreaHandler } from "../src/area-handler";

describe("BufferedWriteChromeStorageAreaHandler", () => {
  describe("#write", () => {
    it("should delay writing more than 500 msecs if MAX_WRITE_OPERATIONS_PER_HOUR return 7200", async () => {
      const spyset = sinon.spy((item, callback) => { callback(); });
      const handler = new BufferedWriteChromeStorageAreaHandler(({
        set: spyset,
        MAX_WRITE_OPERATIONS_PER_HOUR: 7200,
      }: any));

      const start = new Date;
      handler.write({ n1: "v1" });
      await handler.write({ n2: "v2" });
      const elapsedMillis = (new Date).getTime() - start.getTime();

      console.log("elapsedMillis:", elapsedMillis);
      assert(elapsedMillis > 500);

      assert(spyset.calledOnce);
      const [items] = spyset.args[0];
      assert.equal(Object.keys(items).length, 2);
      assert.equal(items["n1"], "v1");
      assert.equal(items["n2"], "v2");
    });
  });
});
