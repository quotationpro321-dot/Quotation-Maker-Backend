const MONTH_MAP: Record<string, number> = {
  JAN: 0,
  FEB: 1,
  MAR: 2,
  APR: 3,
  MAY: 4,
  JUN: 5,
  JUL: 6,
  AUG: 7,
  SEP: 8,
  OCT: 9,
  NOV: 10,
  DEC: 11,
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function parseAmadeusDate(dateStr: string, referenceDate: Date = new Date()): Date {
  const day = parseInt(dateStr.substring(0, 2), 10);
  const monthStr = dateStr.substring(2, 5).toUpperCase();
  const month = MONTH_MAP[monthStr] ?? 0;

  let date = new Date(referenceDate.getFullYear(), month, day);

  const sixMonthsMs = 6 * 30 * 24 * 60 * 60 * 1000;
  if (date < referenceDate && referenceDate.getTime() - date.getTime() > sixMonthsMs) {
    date = new Date(referenceDate.getFullYear() + 1, month, day);
  }

  return date;
}

export function formatAmadeusTime(timeStr: string): string {
  if (timeStr.length !== 4) return timeStr;
  return `${timeStr.substring(0, 2)}:${timeStr.substring(2, 4)}`;
}

export function formatTime12h(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr ?? "00";
  const ampm = h >= 12 ? "pm" : "am";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${ampm}`;
}

export function formatDateDisplay(date: Date): string {
  return `${DAY_NAMES[date.getDay()]} ${String(date.getDate()).padStart(2, "0")} ${MONTH_NAMES[date.getMonth()]}`;
}

export function formatShortDate(date: Date): string {
  return `${String(date.getDate()).padStart(2, "0")} ${MONTH_NAMES[date.getMonth()]}`;
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function combineDateAndTime(date: Date, time24: string): Date {
  const [h, m] = time24.split(":").map((v) => parseInt(v, 10));
  const result = new Date(date);
  result.setHours(h, m, 0, 0);
  return result;
}

export function differenceInMinutes(later: Date, earlier: Date): number {
  return Math.round((later.getTime() - earlier.getTime()) / 60000);
}

export function formatDuration(minutes: number): string {
  if (minutes <= 0) return "-";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}
