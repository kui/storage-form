import { byteLength } from "../ts/strings.js";

describe("byteLength", () => {
  it.each([
    ["", 0],
    ["abc", 3],
    ["é", 2],
    ["あ", 3],
    ["\u{1f600}", 4],
  ])("should count UTF-8 bytes of %p", (s, expected) => {
    expect(byteLength(s)).toBe(expected);
  });
});
