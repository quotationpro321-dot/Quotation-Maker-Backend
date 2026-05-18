import type { GdsParser } from "./types";
import type { ParserResult } from "../flight-converter.types";

/** Sabre parser — scaffold for future patterns. */
export const sabreParser: GdsParser = {
  format: "sabre",
  score: () => 0,
  parse: (lines): ParserResult => ({
    format: "sabre",
    segments: [],
    parsedLineCount: 0,
    skippedLineCount: lines.length,
  }),
};
