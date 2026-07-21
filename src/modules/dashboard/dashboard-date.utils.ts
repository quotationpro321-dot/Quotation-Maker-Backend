import type { TAnalyticsPeriod } from "./dashboard-overview.types";

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 100);
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function formatReference(refId: string): string {
  return refId;
}

export type TDateRange = {
  start: Date;
  end: Date;
  previousStart: Date;
  previousEnd: Date;
};

export function resolveAnalyticsPeriod(period: TAnalyticsPeriod, now = new Date()): TDateRange {
  const end = now;

  switch (period) {
    case "7d": {
      const start = startOfDay(addDays(end, -6));
      const spanMs = end.getTime() - start.getTime();
      return {
        start,
        end,
        previousStart: new Date(start.getTime() - spanMs - 1),
        previousEnd: new Date(start.getTime() - 1),
      };
    }
    case "30d": {
      const start = startOfDay(addDays(end, -29));
      const spanMs = end.getTime() - start.getTime();
      return {
        start,
        end,
        previousStart: new Date(start.getTime() - spanMs - 1),
        previousEnd: new Date(start.getTime() - 1),
      };
    }
    case "90d": {
      const start = startOfDay(addDays(end, -89));
      const spanMs = end.getTime() - start.getTime();
      return {
        start,
        end,
        previousStart: new Date(start.getTime() - spanMs - 1),
        previousEnd: new Date(start.getTime() - 1),
      };
    }
    case "12m": {
      const start = startOfDay(addMonths(end, -11));
      start.setDate(1);
      const previousEnd = new Date(start.getTime() - 1);
      const previousStart = startOfDay(addMonths(previousEnd, -11));
      previousStart.setDate(1);
      return { start, end, previousStart, previousEnd };
    }
    default:
      return resolveAnalyticsPeriod("30d", now);
  }
}

export type TTimeBucket = {
  key: string;
  label: string;
  start: Date;
  end: Date;
};

export function buildAnalyticsBuckets(period: TAnalyticsPeriod, now = new Date()): TTimeBucket[] {
  const range = resolveAnalyticsPeriod(period, now);

  if (period === "7d") {
    return Array.from({ length: 7 }, (_, index) => {
      const day = startOfDay(addDays(range.start, index));
      const end = new Date(day);
      end.setHours(23, 59, 59, 999);
      return {
        key: day.toISOString().slice(0, 10),
        label: day.toLocaleDateString("en-GB", { weekday: "short" }),
        start: day,
        end,
      };
    });
  }

  if (period === "30d") {
    return Array.from({ length: 4 }, (_, index) => {
      const start = startOfDay(addDays(range.start, index * 7));
      const end =
        index === 3
          ? range.end
          : new Date(startOfDay(addDays(start, 7)).getTime() - 1);
      return {
        key: `week-${index + 1}`,
        label: `Week ${index + 1}`,
        start,
        end,
      };
    });
  }

  if (period === "90d") {
    const buckets: TTimeBucket[] = [];
    let cursor = new Date(range.start);
    while (cursor <= range.end) {
      const monthLabel = cursor.toLocaleDateString("en-GB", { month: "short" });
      const weekInMonth = Math.floor((cursor.getDate() - 1) / 14) + 1;
      const start = new Date(cursor);
      const end = new Date(cursor);
      end.setDate(end.getDate() + 13);
      end.setHours(23, 59, 59, 999);
      if (end > range.end) {
        end.setTime(range.end.getTime());
      }
      buckets.push({
        key: `${monthLabel}-w${weekInMonth}-${start.toISOString().slice(0, 10)}`,
        label: `${monthLabel} W${weekInMonth}`,
        start,
        end,
      });
      cursor = startOfDay(addDays(end, 1));
    }
    return buckets.slice(0, 6);
  }

  const buckets: TTimeBucket[] = [];
  let cursor = new Date(range.start);
  while (cursor <= range.end) {
    const start = new Date(cursor);
    const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999);
    buckets.push({
      key: `${start.getFullYear()}-${start.getMonth() + 1}`,
      label: start.toLocaleDateString("en-GB", { month: "short" }),
      start,
      end: end > range.end ? range.end : end,
    });
    cursor = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  }
  return buckets;
}

export function buildWeeklyTrendBuckets(now = new Date()): TTimeBucket[] {
  const end = now;
  const start = startOfDay(addDays(end, -6));
  return Array.from({ length: 7 }, (_, index) => {
    const day = startOfDay(addDays(start, index));
    const bucketEnd = new Date(day);
    bucketEnd.setHours(23, 59, 59, 999);
    return {
      key: day.toISOString().slice(0, 10),
      label: day.toLocaleDateString("en-GB", { weekday: "short" }),
      start: day,
      end: bucketEnd,
    };
  });
}

export function buildMonthlyTrendBuckets(now = new Date()): TTimeBucket[] {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const effectiveEnd = now < monthEnd ? now : monthEnd;

  return Array.from({ length: 4 }, (_, index) => {
    const start = startOfDay(addDays(monthStart, index * 7));
    if (start > effectiveEnd) {
      return {
        key: `week-${index + 1}`,
        label: `Week ${index + 1}`,
        start,
        end: start,
      };
    }
    const end =
      index === 3
        ? effectiveEnd
        : new Date(startOfDay(addDays(start, 7)).getTime() - 1);
    return {
      key: `week-${index + 1}`,
      label: `Week ${index + 1}`,
      start,
      end: end > effectiveEnd ? effectiveEnd : end,
    };
  });
}

export function isWithinRange(date: Date, start: Date, end: Date): boolean {
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

export function countInBuckets<T extends { createdAt?: Date }>(
  items: T[],
  buckets: TTimeBucket[],
  getDate: (item: T) => Date = (item) => item.createdAt ?? new Date(0),
): number[] {
  return buckets.map((bucket) =>
    items.filter((item) => isWithinRange(getDate(item), bucket.start, bucket.end)).length,
  );
}
