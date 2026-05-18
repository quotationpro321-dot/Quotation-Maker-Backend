import type { NormalizedSegment } from "../flight-converter.types";
import {
  combineDateAndTime,
  differenceInMinutes,
  formatDuration,
  parseAmadeusDate,
} from "../utils/date.utils";

export function applySegmentDurations(segments: NormalizedSegment[]): void {
  for (const seg of segments) {
    const depDate = parseAmadeusDate(seg.departureDate);
    const arrDate = parseAmadeusDate(seg.arrivalDate, depDate);

    const depDt = combineDateAndTime(depDate, seg.departureTime);
    let arrDt = combineDateAndTime(arrDate, seg.arrivalTime);

    if (arrDt <= depDt) {
      arrDt = new Date(arrDt.getTime() + 24 * 60 * 60 * 1000);
    }

    const minutes = differenceInMinutes(arrDt, depDt);
    seg.durationMinutes = minutes > 0 ? minutes : null;
    seg.durationDisplay = minutes > 0 ? formatDuration(minutes) : "-";
  }
}

export function applyTransitTimes(segments: NormalizedSegment[]): void {
  for (let i = 0; i < segments.length - 1; i++) {
    const current = segments[i];
    const next = segments[i + 1];

    if (current.toCode !== next.fromCode) {
      current.transitMinutes = null;
      current.transitDisplay = "-";
      continue;
    }

    const curArrDate = parseAmadeusDate(current.arrivalDate);
    const curArrDt = combineDateAndTime(curArrDate, current.arrivalTime);
    const nextDepDate = parseAmadeusDate(next.departureDate);
    const nextDepDt = combineDateAndTime(nextDepDate, next.departureTime);

    const diff = differenceInMinutes(nextDepDt, curArrDt);

    if (diff > 0 && diff < 1440) {
      current.transitMinutes = diff;
      current.transitDisplay = formatDuration(diff);
    } else {
      current.transitMinutes = null;
      current.transitDisplay = "-";
    }
  }

  if (segments.length > 0) {
    const last = segments[segments.length - 1];
    last.transitMinutes = null;
    last.transitDisplay = "-";
  }
}
