// @flow

export default class WorkerQueue {
  q: Array<() => Promise<void>>;
  current: ?Promise<void>;

  constructor() {
    this.q = [];
    this.current = null;
  }

  add(task: () => Promise<void>): Promise<void> {
    return new Promise((resolve) => {
      const t = async () => {
        await task();
        resolve();
        await next(this);
      };
      this.q.push(t);
      next(this);
    });
  }
}

async function next(self: WorkerQueue) {
  if (self.current) return;

  let t;
  while (t = self.q.shift()) {
    self.current = t();
    await self.current;
  }
  self.current = null;
}
