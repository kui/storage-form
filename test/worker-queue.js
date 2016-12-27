import assert from "assert";
import WorkerQueue from "../src/worker-queue";

describe("WorkerQueue", () => {

  const worker = new WorkerQueue;

  it("should process a task.", async () => {
    let count = 0;
    const p = worker.add(async () => {
      await nextTick();
      count++;
    });
    assert(count === 0);
    await p;
    assert(count === 1);
  });

  it("should process two tasks continuously.", async () => {
    let count = 0;
    let msg = [];
    const task = async () => {
      msg.push(`start${count}`);
      await nextTick();
      count++;
      msg.push(`end${count}`);
    };

    const p1 = worker.add(task).then(() => assert.equal(count, 1));
    const p2 = worker.add(task).then(() => assert.equal(count, 2));

    await p1;
    await p2;

    assert.deepEqual(msg, ["start0", "end1", "start1", "end2"]);
  });

  it("should restart when new task come.", async () => {
    let msg = [];

    assert.equal(worker.current, null);
    const p1 = worker.add(async () => {
      msg.push("start 1");
      await nextTick();
      msg.push("end 1");
    });
    assert.notEqual(worker.current, null);
    await p1;
    await nextTick();
    assert.equal(worker.current, null);

    const p2 = worker.add(async () => {
      msg.push("start 2");
      await nextTick();
      msg.push("end 2");
    });
    assert.notEqual(worker.current, null);
    await p2;
    await nextTick();
    assert.equal(worker.current, null);

    assert.deepEqual(msg, ["start 1", "end 1", "start 2", "end 2"]);
  });
});

function nextTick(): Promise<void> {
  return new Promise((resolve) => setInterval(resolve, 1));
}
