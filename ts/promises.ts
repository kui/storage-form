export interface CancellablePromise<T> extends Promise<T> {
  cancel(): void;
}

export function cancellable(
  p: Promise<void>,
  cancel: () => void,
): CancellablePromise<void> {
  return Object.assign(p, { cancel });
}

export function sleep(msec: number): CancellablePromise<void> {
  let timeoutId: ReturnType<typeof setTimeout>;
  let rejectFunction: (reason?: unknown) => void;
  return cancellable(
    new Promise<void>((resolve, reject) => {
      timeoutId = setTimeout(resolve, msec);
      rejectFunction = reject;
    }),
    () => {
      clearTimeout(timeoutId);
      rejectFunction(Error("cancelled"));
    },
  );
}

export class SerialTaskExecutor {
  private readonly queue: (() => Promise<void>)[] = [];
  private isRunning = false;

  async enqueue(task: () => Promise<void>): Promise<void> {
    const { promise, resolve, reject } = withResolves<void>();
    this.queue.push(() => task().then(resolve).catch(reject));

    if (this.isRunning) return promise;

    this.isRunning = true;
    (async () => {
      while (this.queue.length > 0) {
        try {
          await this.queue[0]();
        } finally {
          this.queue.shift();
        }
      }
      this.isRunning = false;
    })().catch(console.error);

    return promise;
  }

  enqueueNoWait(task: () => Promise<void>): void {
    this.enqueue(task).catch(console.error);
  }
}

export function repeatAsPolling(task: () => Promise<void>): {
  stop(): Promise<void>;
} {
  let isRunning = true;
  const promise = (async () => {
    while (isRunning) {
      await task();
      await waitAnimationFrame();
    }
  })().catch(console.error);
  return {
    stop: () => {
      isRunning = false;
      return promise;
    },
  };
}

let waitAnimationFrame: () => Promise<DOMHighResTimeStamp> = (() => {
  if (typeof requestAnimationFrame === "undefined") {
    return () => new Promise((r) => setTimeout(() => r(Date.now()), 100));
  }
  return () => new Promise((r) => requestAnimationFrame(r));
})();

/**
 * Ponyfill for `Promise.withResolvers()`.
 *
 * @return A promise and its resolvers.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers
 */
export function withResolves<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
} {
  let resolve: (value: T) => void;
  let reject: (reason?: unknown) => void;
  const promise = new Promise<T>((r, rj) => {
    resolve = r;
    reject = rj;
  });
  return { promise, resolve: resolve!, reject: reject! };
}
