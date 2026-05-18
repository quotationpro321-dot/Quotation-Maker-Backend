import type {
  ParseError,
  ParseItineraryOptions,
  ParseItineraryResponse,
  ParseWarning,
} from "./flight-converter.types";
import { parseItineraryLines } from "./parsers";
import { normalizeSegments } from "./services/normalizer.service";
import { sanitizeRawItineraryText } from "./services/sanitize.service";

export const flightConverterService = {
  async parseItinerary(
    rawText: string,
    options: ParseItineraryOptions = {},
  ): Promise<ParseItineraryResponse> {
    const warnings: ParseWarning[] = [];
    const errors: ParseError[] = [];

    const { lines } = sanitizeRawItineraryText(rawText);

    if (lines.length === 0) {
      return {
        format: "unknown",
        segments: [],
        warnings,
        errors: [{ code: "EMPTY_INPUT", message: "Please paste at least one flight segment line." }],
        meta: { segmentCount: 0, parsedLineCount: 0, skippedLineCount: 0 },
      };
    }

    const parserResult = parseItineraryLines(lines);

    if (parserResult.segments.length === 0) {
      errors.push({
        code: "UNSUPPORTED_FORMAT",
        message:
          "Could not parse any flight segments. Supported format in v1: Amadeus-style itinerary lines.",
      });

      return {
        format: parserResult.format,
        segments: [],
        warnings,
        errors,
        meta: {
          segmentCount: 0,
          parsedLineCount: parserResult.parsedLineCount,
          skippedLineCount: parserResult.skippedLineCount,
        },
      };
    }

    const segments = await normalizeSegments(parserResult.segments, warnings, options);

    return {
      format: parserResult.format,
      segments,
      warnings,
      errors,
      meta: {
        segmentCount: segments.length,
        parsedLineCount: parserResult.parsedLineCount,
        skippedLineCount: parserResult.skippedLineCount,
      },
    };
  },
};
