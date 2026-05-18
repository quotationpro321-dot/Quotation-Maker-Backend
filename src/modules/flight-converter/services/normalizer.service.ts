import type {
  NormalizedSegment,
  ParseItineraryOptions,
  ParseWarning,
  RawFlightSegment,
} from "../flight-converter.types";
import {
  formatAmadeusTime,
  formatDateDisplay,
  formatShortDate,
  formatTime12h,
  parseAmadeusDate,
} from "../utils/date.utils";
import { resolveAirline, resolveAirport } from "./enrichment.service";
import { applySegmentDurations, applyTransitTimes } from "./itinerary-math.service";

function formatTimeForDisplay(time24: string, timeFormat: "12h" | "24h"): string {
  return timeFormat === "12h" ? formatTime12h(time24) : time24;
}

export async function normalizeSegments(
  rawSegments: RawFlightSegment[],
  warnings: ParseWarning[],
  options: ParseItineraryOptions = {},
): Promise<NormalizedSegment[]> {
  const timeFormat = options.timeFormat ?? "24h";
  const segments: NormalizedSegment[] = [];
  let referenceDate = new Date();

  for (const raw of rawSegments) {
    const depDate = parseAmadeusDate(raw.depDateStr, referenceDate);
    referenceDate = depDate;
    const arrDate = parseAmadeusDate(raw.arrDateStr, depDate);

    const depTime24 = formatAmadeusTime(raw.depTimeStr);
    const arrTime24 = formatAmadeusTime(raw.arrTimeStr);

    const airline = await resolveAirline(raw.airlineCode, warnings, raw.lineNumber);
    const fromName = await resolveAirport(raw.fromCode, warnings, raw.lineNumber);
    const toName = await resolveAirport(raw.toCode, warnings, raw.lineNumber);

    segments.push({
      segmentOrder: raw.segmentOrder,
      airlineCode: raw.airlineCode.toUpperCase(),
      airlineName: airline.name,
      airlineLogoUrl: airline.logoPath,
      flightNumber: `${raw.airlineCode.toUpperCase()}${raw.flightNo}`,
      bookingClass: raw.bookingClass,
      departureDate: raw.depDateStr,
      departureDateDisplay: formatDateDisplay(depDate),
      arrivalDate: raw.arrDateStr,
      arrivalDateDisplay: formatDateDisplay(arrDate),
      departureTime: depTime24,
      arrivalTime: arrTime24,
      arrivalDisplay: arrTime24,
      fromCode: raw.fromCode.toUpperCase(),
      fromName,
      toCode: raw.toCode.toUpperCase(),
      toName,
      durationMinutes: null,
      durationDisplay: "-",
      transitMinutes: null,
      transitDisplay: "-",
      parseConfidence: "high",
      sourceLine: raw.sourceLine,
    });
  }

  applySegmentDurations(segments);
  applyTransitTimes(segments);

  for (const seg of segments) {
    const arrDate = parseAmadeusDate(seg.arrivalDate, parseAmadeusDate(seg.departureDate));
    let arrivalDisplay = formatTimeForDisplay(seg.arrivalTime, timeFormat);
    if (seg.arrivalDate !== seg.departureDate) {
      arrivalDisplay += ` (on the ${formatShortDate(arrDate)})`;
    }

    seg.departureTime = formatTimeForDisplay(seg.departureTime, timeFormat);
    seg.arrivalTime = formatTimeForDisplay(seg.arrivalTime, timeFormat);
    seg.arrivalDisplay = arrivalDisplay;
  }

  return segments;
}
