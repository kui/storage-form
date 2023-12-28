import { NamedSetMap } from "../ts/maps.js";

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
});
