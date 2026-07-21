import { Request } from "express";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";

import AppError from "../../utils/AppError";
import { FlightConverterUsage } from "../flight-converter/models/flight-converter-usage.model";
import { Quotation, type IQuotation } from "../quotations/quotation.model";
import { getQuotationTotalValue } from "../quotations/quotation-projection.utils";
import { QuotationStatus } from "../quotations/quotation.types";
import { UserRole } from "../user/user.types";
import {
  buildAnalyticsBuckets,
  isWithinRange,
  percentChange,
  resolveAnalyticsPeriod,
} from "./dashboard-date.utils";
import type {
  TAnalyticsOverviewDto,
  TAnalyticsPeriod,
} from "./dashboard-overview.types";

type TQuotationRecord = IQuotation & {
  _id: Types.ObjectId;
  createdAt: Date;
  createdBy: { _id: Types.ObjectId; name: string };
};

type TParseRecord = {
  parsedAt: Date;
};

function sumRevenue(quotations: TQuotationRecord[]): number {
  return quotations.reduce((total, quotation) => total + getQuotationTotalValue(quotation), 0);
}

function confirmedQuotations(quotations: TQuotationRecord[]) {
  return quotations.filter((quotation) => quotation.status === QuotationStatus.CONFIRMED);
}

function buildTopAgents(quotations: TQuotationRecord[]) {
  const agentMap = new Map<
    string,
    {
      id: string;
      name: string;
      quotations: number;
      confirmed: number;
      revenue: number;
      currency: string;
    }
  >();

  for (const quotation of quotations) {
    const id = String(quotation.createdBy._id);
    const existing = agentMap.get(id) ?? {
      id,
      name: quotation.createdBy.name,
      quotations: 0,
      confirmed: 0,
      revenue: 0,
      currency: quotation.currency || "GBP",
    };

    existing.quotations += 1;
    if (quotation.status === QuotationStatus.CONFIRMED) {
      existing.confirmed += 1;
      existing.revenue += getQuotationTotalValue(quotation);
    }

    agentMap.set(id, existing);
  }

  return [...agentMap.values()]
    .sort((left, right) => right.quotations - left.quotations)
    .slice(0, 8);
}

export const dashboardAnalyticsService = {
  async getAnalytics(req: Request, period: TAnalyticsPeriod): Promise<TAnalyticsOverviewDto> {
    const role = req.user?.role;
    if (role !== UserRole.ADMIN) {
      throw new AppError(StatusCodes.FORBIDDEN, "Analytics is available to admins only.");
    }

    const range = resolveAnalyticsPeriod(period);
    const buckets = buildAnalyticsBuckets(period);

    const [quotations, parseLogs] = await Promise.all([
      Quotation.find({
        deletedAt: null,
        createdAt: { $gte: range.previousStart, $lte: range.end },
      })
        .populate({ path: "createdBy", select: "name" })
        .lean<TQuotationRecord[]>(),
      FlightConverterUsage.find({
        parsedAt: { $gte: range.previousStart, $lte: range.end },
      })
        .select("parsedAt")
        .lean<TParseRecord[]>(),
    ]);

    const currentQuotations = quotations.filter((quotation) =>
      isWithinRange(quotation.createdAt, range.start, range.end),
    );
    const previousQuotations = quotations.filter((quotation) =>
      isWithinRange(quotation.createdAt, range.previousStart, range.previousEnd),
    );

    const currentConfirmed = confirmedQuotations(currentQuotations);
    const previousConfirmed = confirmedQuotations(previousQuotations);

    const currentRevenue = sumRevenue(currentConfirmed);
    const previousRevenue = sumRevenue(previousConfirmed);

    const currentConversion =
      currentQuotations.length > 0
        ? Math.round((currentConfirmed.length / currentQuotations.length) * 100)
        : 0;
    const previousConversion =
      previousQuotations.length > 0
        ? Math.round((previousConfirmed.length / previousQuotations.length) * 100)
        : 0;

    const currentAvgDeal =
      currentConfirmed.length > 0
        ? Math.round(currentRevenue / currentConfirmed.length)
        : 0;
    const previousAvgDeal =
      previousConfirmed.length > 0
        ? Math.round(previousRevenue / previousConfirmed.length)
        : 0;

    const currentParses = parseLogs.filter((log) =>
      isWithinRange(log.parsedAt, range.start, range.end),
    ).length;
    const previousParses = parseLogs.filter((log) =>
      isWithinRange(log.parsedAt, range.previousStart, range.previousEnd),
    ).length;

    const quotationVolume = buckets.map((bucket) => {
      const bucketQuotations = currentQuotations.filter((quotation) =>
        isWithinRange(quotation.createdAt, bucket.start, bucket.end),
      );
      return {
        label: bucket.label,
        quotations: bucketQuotations.length,
        revenue: sumRevenue(confirmedQuotations(bucketQuotations)),
      };
    });

    const statusBreakdown = Object.values(QuotationStatus).map((status) => ({
      status,
      count: currentQuotations.filter((quotation) => quotation.status === status).length,
    }));

    const parseCounts = buckets.map((bucket) =>
      parseLogs.filter((log) => isWithinRange(log.parsedAt, bucket.start, bucket.end)).length,
    );

    return {
      kpis: [
        {
          key: "conversionRate",
          label: "Conversion Rate",
          value: currentConversion,
          trendPercent: percentChange(currentConversion, previousConversion),
          trendLabel: "vs previous period",
          format: "percent",
        },
        {
          key: "avgDealValue",
          label: "Avg Deal Value",
          value: currentAvgDeal,
          trendPercent: percentChange(currentAvgDeal, previousAvgDeal),
          trendLabel: "vs previous period",
          format: "currency",
        },
        {
          key: "totalRevenue",
          label: "Total Revenue",
          value: currentRevenue,
          trendPercent: percentChange(currentRevenue, previousRevenue),
          trendLabel: "vs previous period",
          format: "currency",
        },
        {
          key: "gdsParses",
          label: "GDS Parses",
          value: currentParses,
          trendPercent: percentChange(currentParses, previousParses),
          trendLabel: "vs previous period",
          format: "number",
        },
      ],
      quotationVolume,
      revenueTrend: quotationVolume.map((point) => ({
        label: point.label,
        quotations: point.quotations,
        revenue: point.revenue,
      })),
      statusBreakdown,
      topAgents: buildTopAgents(currentQuotations),
      flightConverterUsage: buckets.map((bucket, index) => ({
        label: bucket.label,
        parses: parseCounts[index] ?? 0,
      })),
    };
  },
};
