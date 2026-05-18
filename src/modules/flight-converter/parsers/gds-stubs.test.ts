import { describe, expect, it } from "vitest";

import { detectFormat, galileoParser, sabreParser, worldspanParser } from "./index";

describe("GDS parser stubs", () => {
  it("sabre/galileo/worldspan return no segments until implemented", () => {
    const lines = ["XX 100 Y 01JAN 1 LHRJFK HK1 1000 1200 01JAN"];
    expect(sabreParser.parse(lines).segments).toHaveLength(0);
    expect(galileoParser.parse(lines).segments).toHaveLength(0);
    expect(worldspanParser.parse(lines).segments).toHaveLength(0);
  });

  it("detectFormat returns unknown for non-amadeus text", () => {
    expect(detectFormat(["hello", "world"])).toBe("unknown");
  });
});
