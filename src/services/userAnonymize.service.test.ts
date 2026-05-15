import { describe, expect, it } from "vitest";

import { buildAnonymizedEmail, buildAnonymizedUserId } from "./userAnonymize.service";

describe("userAnonymize.service", () => {
  it("builds stable anonymized identifiers from object id", () => {
    const id = "507f1f77bcf86cd799439011";
    expect(buildAnonymizedEmail(id)).toBe(`removed.${id}@anonymized.invalid`);
    expect(buildAnonymizedUserId(id)).toBe(`anonymized-${id}`);
  });
});
