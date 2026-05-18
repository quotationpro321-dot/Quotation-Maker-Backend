import type { GdsParser } from "./types";
import type { ParserResult, RawFlightSegment } from "../flight-converter.types";

const MAX_LINE_LENGTH = 500;

const REMARK_PREFIXES = [
  "SEE ",
  "MANDATORY",
  "PAX ",
  "PLS ",
  "STARLINK",
  "OPERATED",
  "ARNK",
  "Surface",
];

/** Amadeus with leading segment number: `1  QR 104 K 19MAY 2*LHRDOH DK1  0825 1700` */
const SEGMENT_WITH_INDEX =
  /^(\d+)\s+([A-Z0-9]{2})\s*(\d+)\s+([A-Z])\s+(\d{2}[A-Z]{3})\s+(\d)[\*\s]+([A-Z]{3})([A-Z]{3})\s+[A-Z0-9]+\s+(\d{4})\s+(\d{4})(?:\s+(\d{2}[A-Z]{3}))?/;

/** Relaxed: `BG 202 V 30JAN 6 LHRZYL DK1 1815 0955 31JAN` */
const SEGMENT_NO_INDEX =
  /^([A-Z0-9]{2})\s*(\d+)\s+([A-Z])\s+(\d{2}[A-Z]{3})\s+(\d)[\*\s]+([A-Z]{3})([A-Z]{3})\s+[A-Z0-9]+\s+(\d{4})\s+(\d{4})(?:\s+(\d{2}[A-Z]{3}))?/;

function isRemarkLine(line: string): boolean {
  const upper = line.toUpperCase();
  return REMARK_PREFIXES.some((p) => upper.startsWith(p.toUpperCase()));
}

function tryParseLine(line: string, lineNumber: number, order: number): RawFlightSegment | null {
  if (line.length > MAX_LINE_LENGTH) return null;

  const withIndex = line.match(SEGMENT_WITH_INDEX);
  if (withIndex) {
    const [, , airlineCode, flightNo, bookingClass, depDateStr, , fromCode, toCode, depTimeStr, arrTimeStr, arrDateStr] =
      withIndex;
    return {
      segmentOrder: order,
      airlineCode,
      flightNo,
      bookingClass,
      depDateStr,
      arrDateStr: arrDateStr || depDateStr,
      fromCode,
      toCode,
      depTimeStr,
      arrTimeStr,
      sourceLine: line,
      lineNumber,
    };
  }

  const noIndex = line.match(SEGMENT_NO_INDEX);
  if (noIndex) {
    const [, airlineCode, flightNo, bookingClass, depDateStr, , fromCode, toCode, depTimeStr, arrTimeStr, arrDateStr] =
      noIndex;
    return {
      segmentOrder: order,
      airlineCode,
      flightNo,
      bookingClass,
      depDateStr,
      arrDateStr: arrDateStr || depDateStr,
      fromCode,
      toCode,
      depTimeStr,
      arrTimeStr,
      sourceLine: line,
      lineNumber,
    };
  }

  return null;
}

function parseLines(lines: string[]): ParserResult {
  const segments: RawFlightSegment[] = [];
  let parsedLineCount = 0;
  let skippedLineCount = 0;
  let order = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    if (isRemarkLine(line)) {
      skippedLineCount++;
      continue;
    }

    const segment = tryParseLine(line, lineNumber, order + 1);
    if (segment) {
      order++;
      segments.push(segment);
      parsedLineCount++;
    } else if (line.trim()) {
      skippedLineCount++;
    }
  }

  return {
    format: "amadeus",
    segments,
    parsedLineCount,
    skippedLineCount,
  };
}

export const amadeusParser: GdsParser = {
  format: "amadeus",

  score(lines: string[]): number {
    let score = 0;
    for (const line of lines.slice(0, 30)) {
      if (isRemarkLine(line)) continue;
      if (SEGMENT_WITH_INDEX.test(line) || SEGMENT_NO_INDEX.test(line)) {
        score++;
      }
    }
    return score;
  },

  parse(lines: string[]): ParserResult {
    return parseLines(lines);
  },
};

export function previewAmadeusMatch(line: string): boolean {
  return SEGMENT_WITH_INDEX.test(line) || SEGMENT_NO_INDEX.test(line);
}
