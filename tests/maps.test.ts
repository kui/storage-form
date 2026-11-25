import { NamedSetMap, mapKeyValues, mapValues, setAll } from "../ts/maps.js";

describe("NamedSetMap", () => {
  describe("#add", () => {
    it("should add multiple values", () => {
      const map = new NamedSetMap<Set<{ name: string }>, { name: string }>(
        () => new Set(),
      );
      const v1 = { name: "k1" };
      const v2 = { name: "k2" };
      map.add(v1).add(v1).add(v2);
      expect(map.get("k1")).toEqual(new Set([{ name: "k1" }]));
    });
  });

  describe("#deleteByValue", () => {
    it("should delete a value", () => {
      const map = new NamedSetMap<Set<{ name: string }>, { name: string }>(
        () => new Set(),
      );
      const v1 = { name: "k1" };
      map.add(v1);
      map.deleteByValue(v1);
      expect(map.get("k1")).toBeUndefined();
    });

    it("should delete a value if it exists", () => {
      const map = new NamedSetMap<Set<{ name: string }>, { name: string }>(
        () => new Set(),
      );
      const v1 = { name: "k1" };
      const v2 = { name: "k1" };
      map.add(v1);
      map.add(v2);
      map.deleteByValue(v1);
      expect(map.get("k1")).toEqual(new Set([{ name: "k1" }]));
    });

    it("should not delete a value if it does not exist", () => {
      const map = new NamedSetMap<Set<{ name: string }>, { name: string }>(
        () => new Set(),
      );
      const v1 = { name: "k1" };
      const v2 = { name: "k2" };
      map.add(v1);
      map.deleteByValue(v2);
      expect(map.get("k1")).toEqual(new Set([{ name: "k1" }]));
    });

    it("should not delete a key if it does not exist", () => {
      const map = new NamedSetMap<Set<{ name: string }>, { name: string }>(
        () => new Set(),
      );
      const v1 = { name: "k1" };
      const v2 = { name: "k2" };
      map.add(v1);
      map.deleteByValue(v2);
      expect(map.get("k1")).toEqual(new Set([{ name: "k1" }]));
    });
  });

  describe("#deleteByKeyValue", () => {
    it("should delete a value with the key instead of its name", () => {
      const map = new NamedSetMap<Set<{ name: string }>, { name: string }>(
        () => new Set(),
      );
      const v = { name: "old" };
      map.add(v);
      v.name = "new";
      expect(map.deleteByKeyValue("new", v)).toBe(false);
      expect(map.deleteByKeyValue("old", v)).toBe(true);
      expect(map.size).toBe(0);
    });
  });

  describe("#flattenValues", () => {
    it("should iterate the values of all keys", () => {
      const map = new NamedSetMap<
        Set<{ name: string; id: number }>,
        { name: string; id: number }
      >(() => new Set());
      map.add({ name: "k1", id: 1 });
      map.add({ name: "k2", id: 2 });
      map.add({ name: "k1", id: 3 });
      expect([...map.flattenValues()].map(({ id }) => id)).toEqual([1, 3, 2]);
    });
  });
});

describe("setAll", () => {
  it("should add and overwrite entries", () => {
    const map = new Map([
      ["a", 1],
      ["b", 2],
    ]);
    setAll(map, [
      ["b", 3],
      ["c", 4],
    ]);
    expect([...map]).toEqual([
      ["a", 1],
      ["b", 3],
      ["c", 4],
    ]);
  });
});

describe("mapKeyValues", () => {
  it("should map keys and values", () => {
    const map = new Map([["a", 1]]);
    const result = mapKeyValues(
      map,
      (k, v) => `${k}${v.toString()}`,
      (k, v) => [k, v],
    );
    expect(result).toEqual(new Map([["a1", ["a", 1]]]));
    expect(map).toEqual(new Map([["a", 1]]));
  });
});

describe("mapValues", () => {
  it("should map values with the same keys", () => {
    const result = mapValues(new Map([["a", 1]]), (k, v) => [k, v]);
    expect(result).toEqual(new Map([["a", ["a", 1]]]));
  });
});
