import { SetValueMap } from "../ts/maps.js";

describe("SetValueMap", () => {
  describe("#add", () => {
    it("should add multiple values", () => {
      const map = new SetValueMap<string, string>();
      map.add("k1", "v1");
      map.add("k1", "v2");
      expect(map.get("k1")).toEqual(new Set(["v1", "v2"]));
    });

    it("should not add a value if it already exists", () => {
      const map = new SetValueMap<string, string>();
      map.add("k1", "v1");
      map.add("k1", "v1");
      expect(map.get("k1")).toEqual(new Set(["v1"]));
    });
  });

  describe("#deleteByKey", () => {
    it("should delete a value", () => {
      const map = new SetValueMap<string, string>();
      map.add("k1", "v1");
      map.deleteByKey("k1", "v1");
      expect(map.get("k1")).toBeUndefined();
    });

    it("should delete a value if it exists", () => {
      const map = new SetValueMap<string, string>();
      map.add("k1", "v1");
      map.add("k1", "v2");
      map.deleteByKey("k1", "v1");
      expect(map.get("k1")).toEqual(new Set(["v2"]));
    });

    it("should not delete a value if it does not exist", () => {
      const map = new SetValueMap<string, string>();
      map.add("k1", "v1");
      map.deleteByKey("k1", "v2");
      expect(map.get("k1")).toEqual(new Set(["v1"]));
    });

    it("should not delete a key if it does not exist", () => {
      const map = new SetValueMap<string, string>();
      map.add("k1", "v1");
      map.deleteByKey("k2", "v1");
      expect(map.get("k1")).toEqual(new Set(["v1"]));
    });
  });
});
