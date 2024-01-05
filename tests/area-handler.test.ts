import { AreaHandler, BufferedWriteHandler } from "../ts/area-handler.js";

describe("BufferedWriteChromeStorageAreaHandler", () => {
  describe("#write", () => {
    it("should delay the second writing", async () => {
      const mockedWrite = jest.fn();
      const handler = new BufferedWriteHandler(
        { write: mockedWrite } as unknown as AreaHandler,
        200,
      );

      const start = performance.now();
      await handler.write(new Map([["n1", "v1"]]));
      const firstElapsedMillis = performance.now() - start;
      void handler.write(new Map([["n2", "v2"]]));
      await handler.write(new Map([["n3", "v3"]]));
      const secondElapsedMillis = performance.now() - start;

      console.log("firstElapsedMillis:", firstElapsedMillis);
      console.log("secondElapsedMillis:", secondElapsedMillis);

      expect(firstElapsedMillis).toBeLessThan(100);
      expect(secondElapsedMillis).toBeGreaterThan(400);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockedWrite).toHaveBeenCalledTimes(2);

      const [firstItems] = mockedWrite.mock.calls[0] as unknown[];
      expect(firstItems).toEqual(new Map([["n1", "v1"]]));

      const [secondItems] = mockedWrite.mock.calls[1] as unknown[];
      expect(secondItems).toEqual(
        new Map([
          ["n3", "v3"],
          ["n2", "v2"],
        ]),
      );
    });
  });
});
