import { BufferedWriteAreaHandler } from "../src/area-handler.ts";

interface AreaHandler {
  read(names: string[]): Promise<Record<string, string>>;
  write(items: Record<string, string>): Promise<void>;
}

describe("BufferedWriteChromeStorageAreaHandler", () => {
  describe("#write", () => {
    it("should delay the second writing", async () => {
      const mockedWrite = jest.fn();
      const handler = new BufferedWriteAreaHandler(
        { write: mockedWrite } as unknown as AreaHandler,
        14400,
      );

      const start = performance.now();
      await handler.write({ n1: "v1" });
      const firstElapsedMillis = performance.now() - start;
      void handler.write({ n2: "v2" });
      await handler.write({ n3: "v3" });
      const secondElapsedMillis = performance.now() - start;

      console.log("firstElapsedMillis:", firstElapsedMillis);
      console.log("secondElapsedMillis:", secondElapsedMillis);

      expect(firstElapsedMillis).toBeLessThan(100);
      expect(secondElapsedMillis).toBeGreaterThanOrEqual(400);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockedWrite).toHaveBeenCalledTimes(2);

      const [firstItems] = mockedWrite.mock.calls[0] as unknown[];
      expect(firstItems).toEqual({ n1: "v1" });

      const [secondItems] = mockedWrite.mock.calls[1] as unknown[];
      expect(secondItems).toEqual({ n2: "v2", n3: "v3" });
    });
  });
});
