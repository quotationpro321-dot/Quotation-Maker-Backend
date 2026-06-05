import type { GdsFormat, ParserResult } from "../flight-converter.types";
import { amadeusParser } from "./amadeus.parser";
import { galileoParser } from "./galileo.parser";
import { sabreParser } from "./sabre.parser";
import type { GdsParser } from "./types";
import { worldspanParser } from "./worldspan.parser";

const PARSERS: GdsParser[] = [amadeusParser, sabreParser, galileoParser, worldspanParser];

export function detectFormat(lines: string[]): GdsFormat {
  let best: { format: GdsFormat; score: number } = { format: "unknown", score: 0 };

  for (const parser of PARSERS) {
    const score = parser.score(lines);
    if (score > best.score) {
      best = { format: parser.format, score };
    }
  }

  return best.score > 0 ? best.format : "unknown";
}

export function parseWithFormat(format: GdsFormat, lines: string[]): ParserResult {
  const parser = PARSERS.find((p) => p.format === format) ?? amadeusParser;
  return parser.parse(lines);
}

export function parseItineraryLines(lines: string[]): ParserResult {
  const format = detectFormat(lines);
  if (format === "unknown") {
    return amadeusParser.parse(lines);
  }
  return parseWithFormat(format, lines);
}

export { amadeusParser, sabreParser, galileoParser, worldspanParser };
