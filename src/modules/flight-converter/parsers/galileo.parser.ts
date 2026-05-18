import type { GdsParser } from "./types";
import type { ParserResult } from "../flight-converter.types";

/** Galileo parser — scaffold for future patterns. */
export const galileoParser: GdsParser = {
  format: "galileo",
  score: () => 0,
  parse: (lines): ParserResult => ({
    format: "galileo",
    segments: [],
    parsedLineCount: 0,
    skippedLineCount: lines.length,
  }),
};
