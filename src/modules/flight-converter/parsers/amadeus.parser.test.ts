import { describe, expect, it } from "vitest";

import { amadeusParser } from "./amadeus.parser";
import { sanitizeRawItineraryText } from "../services/sanitize.service";

const QR_EXAMPLE = `1  QR 104 K 19MAY 2*LHRDOH DK1  0825 1700  19MAY  E  0 351 M
     MANDATORY REQUIRED DOCS DOCO DOCA CTCM CTCE
  2  QR 642 K 19MAY 2*DOHDAC DK1  1820 0230  20MAY  E  0 77W M
  3  QR 639 N 15OCT 4*DACDOH DK1  0410 0650  15OCT  E  0 77W M
  4  QR 003 N 15OCT 4*DOHLHR DK1  0800 1315  15OCT  E  0 77W M`;

const BG_EXAMPLE = `BG 202 V 30JAN 6 LHRZYL DK1 1815 0955 31JAN
BG 201 V 03MAR 3 ZYLLHR DK1 1025 1605 03MAR`;

const BG_NUMBERED = `1  BG 202 V 30JAN 6 LHRZYL DK1  1815 0955  31JAN  E  0 788 M
2  BG 201 V 03MAR 2 ZYLLHR DK1  1025 1605  03MAR  E  0 788 M`;

describe("amadeusParser", () => {
  it("parses 4-segment Qatar Airways itinerary", () => {
    const { lines } = sanitizeRawItineraryText(QR_EXAMPLE);
    const result = amadeusParser.parse(lines);

    expect(result.segments).toHaveLength(4);
    expect(result.segments[0].airlineCode).toBe("QR");
    expect(result.segments[0].flightNo).toBe("104");
    expect(result.segments[0].fromCode).toBe("LHR");
    expect(result.segments[0].toCode).toBe("DOH");
    expect(result.parsedLineCount).toBe(4);
  });

  it("parses relaxed BG lines without segment index", () => {
    const { lines } = sanitizeRawItineraryText(BG_EXAMPLE);
    const result = amadeusParser.parse(lines);

    expect(result.segments).toHaveLength(2);
    expect(result.segments[0].airlineCode).toBe("BG");
    expect(result.segments[0].fromCode).toBe("LHR");
    expect(result.segments[0].toCode).toBe("ZYL");
    expect(result.segments[1].fromCode).toBe("ZYL");
    expect(result.segments[1].toCode).toBe("LHR");
  });

  it("parses numbered BG lines", () => {
    const { lines } = sanitizeRawItineraryText(BG_NUMBERED);
    const result = amadeusParser.parse(lines);

    expect(result.segments).toHaveLength(2);
    expect(result.segments[0].arrDateStr).toBe("31JAN");
  });

  it("skips remark lines and handles extra blank lines", () => {
    const text = `

1  QR 104 K 19MAY 2*LHRDOH DK1  0825 1700  19MAY  E  0 351 M
SEE RTSVC

`;
    const { lines } = sanitizeRawItineraryText(text);
    const result = amadeusParser.parse(lines);

    expect(result.segments).toHaveLength(1);
    expect(result.skippedLineCount).toBeGreaterThanOrEqual(1);
  });

  it("returns empty segments for unsupported text", () => {
    const { lines } = sanitizeRawItineraryText("hello world\nnot a pnr");
    const result = amadeusParser.parse(lines);

    expect(result.segments).toHaveLength(0);
  });
});
