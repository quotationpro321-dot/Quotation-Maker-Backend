import type { GdsFormat, ParserResult } from "../flight-converter.types";

export interface GdsParser {
  format: GdsFormat;
  score(lines: string[]): number;
  parse(lines: string[]): ParserResult;
}
