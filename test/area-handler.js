import assert from "assert";
import sinon from "sinon";
import * as utils from "../src/utils";
import { BatchWriteChromeStorageAreaHandler } from "../src/area-handler";

describe("BatchWriteChromeStorageAreaHandler", () => {
  describe(".write", () => {
    it("should delay writing more than 500 msecs if MAX_WRITE_OPERATIONS_PER_HOUR return 7200", async () => {
      let isDone;
      const spyset = sinon.spy(() => {
        isDone = true;
      });
      const handler = new BatchWriteChromeStorageAreaHandler(({
        set: spyset,
        MAX_WRITE_OPERATIONS_PER_HOUR: 7200,
      }: any));

      const start = new Date;
      handler.write("n1", "v1");
      handler.write("n2", "v2");
      while (!isDone) {
        await utils.sleep(100);
      }
      const elapsedMillis = (new Date).getTime() - start.getTime();

      console.log("elapsedMillis:", elapsedMillis);
      assert(elapsedMillis > 1000);

      assert(spyset.calledOnce);
      const [setItems] = spyset.args[0];
      assert.equal(Object.keys(setItems).length, 2);
      assert.equal(setItems["n1"], "v1");
      assert.equal(setItems["n2"], "v2");
    });
  });
});
