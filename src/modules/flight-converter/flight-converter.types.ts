export type GdsFormat = "amadeus" | "sabre" | "galileo" | "worldspan" | "unknown";

export type ParseConfidence = "high" | "partial";

export type TimeFormat = "12h" | "24h";

export interface ParseItineraryOptions {
  timeFormat?: TimeFormat;
  showOperatedBy?: boolean;
}

export interface RawFlightSegment {
  segmentOrder: number;
  airlineCode: string;
  flightNo: string;
  bookingClass: string;
  depDateStr: string;
  arrDateStr: string;
  fromCode: string;
  toCode: string;
  depTimeStr: string;
  arrTimeStr: string;
  sourceLine: string;
  lineNumber: number;
}

export interface ParserResult {
  format: GdsFormat;
  segments: RawFlightSegment[];
  parsedLineCount: number;
  skippedLineCount: number;
}

export interface ParseWarning {
  line?: number;
  code: string;
  message: string;
}

export interface ParseError {
  code: string;
  message: string;
}

export interface NormalizedSegment {
  segmentOrder: number;
  airlineCode: string;
  airlineName: string;
  airlineLogoUrl: string;
  flightNumber: string;
  bookingClass: string;
  cabinType?: string;
  departureDate: string;
  departureDateDisplay: string;
  arrivalDate: string;
  arrivalDateDisplay: string;
  departureTime: string;
  arrivalTime: string;
  arrivalDisplay: string;
  fromCode: string;
  fromName: string;
  toCode: string;
  toName: string;
  durationMinutes: number | null;
  durationDisplay: string;
  transitMinutes: number | null;
  transitDisplay: string;
  terminalDepart?: string;
  terminalArrive?: string;
  parseConfidence: ParseConfidence;
  sourceLine?: string;
}

export interface ParseItineraryResponse {
  format: GdsFormat;
  segments: NormalizedSegment[];
  warnings: ParseWarning[];
  errors: ParseError[];
  meta: {
    segmentCount: number;
    parsedLineCount: number;
    skippedLineCount: number;
  };
}
