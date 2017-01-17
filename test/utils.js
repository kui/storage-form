import assert from "assert";
import sinon from "sinon";
import * as utils from "../src/utils";

describe("utils", () => {
  describe("#mergeNextPromise", () => {
    it("should abort the more than third task in a short term.", async () => {
      let count = 0;
      const t = utils.mergeNextPromise(async () => {
        await utils.sleep(70);
        count++;
      });

      for (let i = 0; i < 5; i++) t();
      await t();

      assert.equal(count, 2);
    });
    it("should run the third task when waiting the second task.", async () => {
      let count = 0;
      const t = utils.mergeNextPromise(async () => {
        await utils.sleep(70);
        count++;
      });

      t();
      await t();
      await t();

      assert.equal(count, 3);
    });
    it("should run the all tasks when waiting all.", async () => {
      let count = 0;
      const t = utils.mergeNextPromise(async () => {
        await utils.sleep(70);
        count++;
      });

      for (let i = 0; i < 4; i++) await t();

      assert.equal(count, 4);
    });
  });
});
