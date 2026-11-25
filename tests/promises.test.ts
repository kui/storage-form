import { sleep, SerialTaskExecutor, withResolves } from "../ts/promises.js";

describe("sleep", () => {
  it("should resolve after the specified time", async () => {
    const startTime = Date.now();
    await sleep(100);
    const endTime = Date.now();
    expect(endTime - startTime).toBeGreaterThanOrEqual(100);
  });

  it("should reject if cancelled", async () => {
    const promise = sleep(100);
    promise.cancel();
    await expect(promise).rejects.toThrow(/cancelled/i);
  });
});

describe("SerialTaskExecutor", () => {
  describe("#enqueueNoWait", () => {
    it("should log an error if the task is rejected", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation();
      const executor = new SerialTaskExecutor();
      const error = Error("test");
      executor.enqueueNoWait(() => Promise.reject(error));
      await sleep(0);
      expect(spy).toHaveBeenCalledWith(error);
    });
  });

  describe("#enqueue", () => {
    it("should execute a task after the queue gets empty", async () => {
      const executor = new SerialTaskExecutor();
      const task = jest.fn();
      await executor.enqueue(task);
      await sleep(0);
      await executor.enqueue(task);
      expect(task).toHaveBeenCalledTimes(2);
    });

    it("should reject if the task throws synchronously", async () => {
      const executor = new SerialTaskExecutor();
      const p = executor.enqueue(() => {
        throw Error("test");
      });
      await expect(p).rejects.toThrow("test");
    });

    it("should execute tasks serially", async () => {
      const executor = new SerialTaskExecutor();
      const results: number[] = [];
      const task = (n: number) => () => {
        results.push(n);
        return sleep(100);
      };
      const promises = [
        executor.enqueue(task(1)),
        executor.enqueue(task(2)),
        executor.enqueue(task(3)),
      ];
      await Promise.all(promises);
      expect(results).toEqual([1, 2, 3]);
    });

    it("should execute tasks serially even if a task is rejected", async () => {
      const executor = new SerialTaskExecutor();
      const results: number[] = [];
      const task = (n: number) => () => {
        results.push(n);
        return sleep(100);
      };
      const promises = [
        executor.enqueue(task(1)),
        executor.enqueue(() => Promise.reject(Error("test"))),
        executor.enqueue(task(3)),
      ];
      await Promise.allSettled(promises);
      expect(results).toEqual([1, 3]);
    });

    it("should await enqueued tasks", async () => {
      const executor = new SerialTaskExecutor();
      const results: number[] = [];
      const task = (n: number) => async () => {
        await sleep(200);
        results.push(n);
      };
      void executor.enqueue(task(1));
      await executor.enqueue(task(2));
      void executor.enqueue(task(3));
      expect(results).toEqual([1, 2]);
    });

    it("should reject if the task is rejected", async () => {
      const executor = new SerialTaskExecutor();
      void executor.enqueue(() => sleep(100));
      const p = executor.enqueue(() => Promise.reject(Error("test")));
      void executor.enqueue(() => sleep(100));
      await expect(p).rejects.toThrow("test");
    });
  });
});

describe("withResolves", () => {
  it("should resolve when the resolve is called", async () => {
    const { promise, resolve } = withResolves();
    const p = promise.then(() => "test");
    resolve();
    await expect(p).resolves.toBe("test");
  });
  it("should reject when the reject is called", async () => {
    const { promise, reject } = withResolves();
    const p = promise.then(() => "test");
    reject(Error("test"));
    await expect(p).rejects.toThrow("test");
  });
});
