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
  private readonly queue: (() => void | Promise<void>)[] = [];
  private isRunning = false;

  async enqueue(task: () => void | Promise<void>): Promise<void> {
    const { promise, resolve, reject } = withResolves();
    this.queue.push(async () => {
      try {
        await task();
        resolve();
      } catch (e) {
        reject(e);
      }
    });

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

  enqueueNoWait(task: () => void | Promise<void>): void {
    this.enqueue(task).catch(console.error);
  }
}

/**
 * Ponyfill for `Promise.withResolvers()`.
 *
 * @return A promise and its resolvers.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers
 */
export function withResolves<T = void>(): {
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
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return { promise, resolve: resolve!, reject: reject! };
}
