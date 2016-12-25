export function sleep(msec: number): Promise<void> {
  return new Promise((resolve) => {
    setInterval(() => resolve(), msec);
  });
}
