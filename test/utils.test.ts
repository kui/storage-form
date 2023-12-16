import assert from "assert";
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
    it("should return the same promise with third task and second task.", async () => {
      const t = utils.mergeNextPromise(async () => {
        await utils.sleep(70);
      });

      const start = new Date().getTime();
      const p1 = t().then(() => new Date().getTime() - start);
      const p2 = t().then(() => new Date().getTime() - start);
      const p3 = t().then(() => new Date().getTime() - start);

      const times = await Promise.all([p1, p2, p3]);
      console.log("elapsedTimeMillis: ", times);
      const d12 = Math.abs(times[0] - times[1]);
      const d13 = Math.abs(times[0] - times[2]);
      const d23 = Math.abs(times[1] - times[2]);
      assert(d12 >= 69);
      assert(d13 >= 69);
      assert(d23 <= 20);
    });
  });
});
