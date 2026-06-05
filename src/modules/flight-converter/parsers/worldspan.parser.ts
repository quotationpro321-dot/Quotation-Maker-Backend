import type { GdsParser } from "./types";
import type { ParserResult } from "../flight-converter.types";

/** Worldspan parser — scaffold for future patterns. */
export const worldspanParser: GdsParser = {
  format: "worldspan",
  score: () => 0,
  parse: (lines): ParserResult => ({
    format: "worldspan",
    segments: [],
    parsedLineCount: 0,
    skippedLineCount: lines.length,
  }),
};
