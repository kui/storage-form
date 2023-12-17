import Binder from "../src/binder.ts";

describe("Binder", () => {
  describe("#aToB", () => {
    it("should write all value of 'a' to 'b' on init.", async () => {
      const a = {
        readAll: jest.fn(() =>
          Promise.resolve(
            new Map([
              ["n1", "v1"],
              ["n2", "v2"],
            ]),
          ),
        ),
        write: jest.fn(),
      };
      const b = {
        readAll: jest.fn(),
        write: jest.fn(),
      };
      const binder = new Binder({
        a,
        b,
        diff: (oldValue, newValue) => ({
          change: { oldValue, newValue },
          isChanged: oldValue !== newValue,
        }),
      });

      await binder.aToB();

      expect(a.readAll).toHaveBeenCalledTimes(1);
      expect(b.readAll).toHaveBeenCalledTimes(0);
      expect(a.write).toHaveBeenCalledTimes(0);
      expect(b.write).toHaveBeenCalledTimes(1);

      const args = b.write.mock.calls[0] as unknown[];
      const diffs = args[0] as Map<
        string,
        { oldValue: string; newValue: string }
      >;
      expect(diffs.size).toBe(2);
      expect(diffs.get("n1")?.newValue).toBe("v1");
      expect(diffs.get("n2")?.newValue).toBe("v2");
    });
    it("should do nothing if no value in 'a'.", async () => {
      const a = {
        readAll: jest.fn(() => Promise.resolve(new Map())),
        write: jest.fn(),
      };
      const b = {
        readAll: jest.fn(),
        write: jest.fn(),
      };
      const binder = new Binder({
        a,
        b,
        diff: (oldValue, newValue) => ({
          change: { oldValue, newValue },
          isChanged: oldValue !== newValue,
        }),
      });

      await binder.aToB();

      expect(a.readAll).toHaveBeenCalledTimes(1);
      expect(b.readAll).toHaveBeenCalledTimes(0);
      expect(a.write).toHaveBeenCalledTimes(0);
      expect(b.write).toHaveBeenCalledTimes(0);
    });
    it("should do nothing on second call.", async () => {
      const a = {
        readAll: jest.fn(() =>
          Promise.resolve(
            new Map([
              ["n1", "v1"],
              ["n2", "v2"],
            ]),
          ),
        ),
        write: jest.fn(),
      };
      const b = {
        readAll: jest.fn(),
        write: jest.fn(),
      };
      const binder = new Binder({
        a,
        b,
        diff: (oldValue, newValue) => ({
          change: { oldValue, newValue },
          isChanged: oldValue !== newValue,
        }),
      });

      await binder.aToB();

      expect(a.readAll).toHaveBeenCalledTimes(1);
      expect(b.readAll).toHaveBeenCalledTimes(0);
      expect(a.write).toHaveBeenCalledTimes(0);
      expect(b.write).toHaveBeenCalledTimes(1);

      await binder.aToB();

      expect(a.readAll).toHaveBeenCalledTimes(2);
      expect(b.readAll).toHaveBeenCalledTimes(0);
      expect(a.write).toHaveBeenCalledTimes(0);
      expect(b.write).toHaveBeenCalledTimes(1);
    });
    it("should write twice if provided 'force' on second call.", async () => {
      const a = {
        readAll: jest.fn(() =>
          Promise.resolve(
            new Map([
              ["n1", "v1"],
              ["n2", "v2"],
            ]),
          ),
        ),
        write: jest.fn(),
      };
      const b = {
        readAll: jest.fn(),
        write: jest.fn(),
      };
      const binder = new Binder({
        a,
        b,
        diff: (oldValue, newValue) => ({
          change: { oldValue, newValue },
          isChanged: oldValue !== newValue,
        }),
      });

      await binder.aToB();

      expect(a.readAll).toHaveBeenCalledTimes(1);
      expect(b.readAll).toHaveBeenCalledTimes(0);
      expect(a.write).toHaveBeenCalledTimes(0);
      expect(b.write).toHaveBeenCalledTimes(1);

      await binder.aToB({ force: true });

      expect(a.readAll).toHaveBeenCalledTimes(2);
      expect(b.readAll).toHaveBeenCalledTimes(0);
      expect(a.write).toHaveBeenCalledTimes(0);
      expect(b.write).toHaveBeenCalledTimes(2);
    });
  });
});
