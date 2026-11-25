import { buildWithIndex, distinctConcat, remove } from "../ts/arrays.js";

describe("remove", () => {
  it("should remove only the first occurrence", () => {
    const array = ["a", "b", "a"];
    expect(remove(array, "a")).toBe(true);
    expect(array).toEqual(["b", "a"]);
  });

  it("should do nothing if the item does not exist", () => {
    const array = ["a"];
    expect(remove(array, "b")).toBe(false);
    expect(array).toEqual(["a"]);
  });
});

describe("buildWithIndex", () => {
  it("should build an array with indexes", () => {
    expect(buildWithIndex(3, (i) => i * 2)).toEqual([0, 2, 4]);
  });

  it("should build an empty array", () => {
    expect(buildWithIndex(0, (i) => i)).toEqual([]);
  });
});

describe("distinctConcat", () => {
  it("should keep the first-appearance order without duplicates", () => {
    expect(distinctConcat(["b", "a", "b"], ["c", "a"])).toEqual([
      "b",
      "a",
      "c",
    ]);
  });

  it("should return an empty array without arguments", () => {
    expect(distinctConcat()).toEqual([]);
  });
});
