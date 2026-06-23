import { Request } from "express";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";

import AppError from "../../utils/AppError";
import { FlightConverterUsage } from "../flight-converter/models/flight-converter-usage.model";
import { Quotation, type IQuotation } from "../quotations/quotation.model";
import { getQuotationTotalValue } from "../quotations/quotation-projection.utils";
import { QuotationStatus } from "../quotations/quotation.types";
import { User } from "../user/user.model";
import { UserRole, UserStatus } from "../user/user.types";
import {
  addDays,
  buildMonthlyTrendBuckets,
  buildWeeklyTrendBuckets,
  countInBuckets,
  formatReference,
  initialsFromName,
  percentChange,
  startOfDay,
} from "./dashboard-date.utils";
import type {
  TDashboardActivityDto,
  TDashboardOverviewDto,
  TDashboardQuotationRowDto,
  TDashboardStatDto,
} from "./dashboard-overview.types";

type TPopulatedQuotation = IQuotation & {
  _id: Types.ObjectId;
  createdAt: Date;
  createdBy: { _id: Types.ObjectId; name: string };
};

const CREATOR_POPULATE = { path: "createdBy", select: "name" };
const ACTIVE_USER_FILTER = { status: { $nin: [UserStatus.DELETED, UserStatus.BANNED] } };

async function resolveActorObjectId(userId: string): Promise<Types.ObjectId> {
  if (!Types.ObjectId.isValid(userId)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid session user.");
  }
  return new Types.ObjectId(userId);
}

function buildQuotationFilter(actorObjectId: Types.ObjectId | null) {
  return actorObjectId ? { createdBy: actorObjectId } : {};
}

async function countByStatus(filter: Record<string, unknown>) {
  const rows = await Quotation.aggregate<{ _id: QuotationStatus; count: number }>([
    { $match: filter },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const counts: Record<QuotationStatus, number> = {
    [QuotationStatus.DRAFT]: 0,
    [QuotationStatus.PENDING]: 0,
    [QuotationStatus.CONFIRMED]: 0,
    [QuotationStatus.CANCELLED]: 0,
  };

  for (const row of rows) {
    counts[row._id] = row.count;
  }

  return counts;
}

async function countQuotationsBetween(
  filter: Record<string, unknown>,
  start: Date,
  end: Date,
) {
  return Quotation.countDocuments({
    ...filter,
    createdAt: { $gte: start, $lte: end },
  });
}

function buildStat(
  key: string,
  label: string,
  value: number,
  current: number,
  previous: number,
  trendLabel: string,
): TDashboardStatDto {
  return {
    key,
    label,
    value,
    trendPercent: percentChange(current, previous),
    trendLabel,
  };
}

async function buildAdminStats(filter: Record<string, unknown>): Promise<TDashboardStatDto[]> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(monthStart.getTime() - 1);
  const weekStart = startOfDay(addDays(now, -6));
  const previousWeekStart = startOfDay(addDays(weekStart, -7));
  const previousWeekEnd = new Date(weekStart.getTime() - 1);
  const thirtyDaysAgo = startOfDay(addDays(now, -30));
  const previousThirtyDaysStart = startOfDay(addDays(thirtyDaysAgo, -30));
  const previousThirtyDaysEnd = new Date(thirtyDaysAgo.getTime() - 1);

  const [
    totalUsers,
    totalAdmins,
    totalEmployees,
    statusCounts,
    totalQuotations,
    monthQuotations,
    previousMonthQuotations,
    weekPending,
    previousWeekPending,
    monthConfirmed,
    previousMonthConfirmed,
    activeAgentIds,
    previousActiveAgentIds,
  ] = await Promise.all([
    User.countDocuments(ACTIVE_USER_FILTER),
    User.countDocuments({ ...ACTIVE_USER_FILTER, role: UserRole.ADMIN }),
    User.countDocuments({ ...ACTIVE_USER_FILTER, role: UserRole.EMPLOYEE }),
    countByStatus(filter),
    Quotation.countDocuments(filter),
    countQuotationsBetween(filter, monthStart, now),
    countQuotationsBetween(filter, previousMonthStart, previousMonthEnd),
    Quotation.countDocuments({
      ...filter,
      status: QuotationStatus.PENDING,
      createdAt: { $gte: weekStart, $lte: now },
    }),
    Quotation.countDocuments({
      ...filter,
      status: QuotationStatus.PENDING,
      createdAt: { $gte: previousWeekStart, $lte: previousWeekEnd },
    }),
    Quotation.countDocuments({
      ...filter,
      status: QuotationStatus.CONFIRMED,
      createdAt: { $gte: monthStart, $lte: now },
    }),
    Quotation.countDocuments({
      ...filter,
      status: QuotationStatus.CONFIRMED,
      createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd },
    }),
    Quotation.distinct("createdBy", { createdAt: { $gte: thirtyDaysAgo } }),
    Quotation.distinct("createdBy", {
      createdAt: { $gte: previousThirtyDaysStart, $lte: previousThirtyDaysEnd },
    }),
  ]);

  return [
    buildStat(
      "totalUsers",
      "Total Users",
      totalUsers,
      totalUsers,
      totalUsers,
      "vs last month",
    ),
    buildStat(
      "totalAdmins",
      "Total Admins",
      totalAdmins,
      totalAdmins,
      totalAdmins,
      "vs last month",
    ),
    buildStat(
      "totalEmployees",
      "Total Employees",
      totalEmployees,
      totalEmployees,
      totalEmployees,
      "vs last month",
    ),
    buildStat(
      "totalQuotations",
      "Total Quotations",
      totalQuotations,
      monthQuotations,
      previousMonthQuotations,
      "vs last month",
    ),
    buildStat(
      "pendingApproval",
      "Pending Approval",
      statusCounts[QuotationStatus.PENDING],
      weekPending,
      previousWeekPending,
      "vs last week",
    ),
    buildStat(
      "confirmedDeals",
      "Confirmed Deals",
      statusCounts[QuotationStatus.CONFIRMED],
      monthConfirmed,
      previousMonthConfirmed,
      "vs last month",
    ),
    buildStat(
      "activeAgents",
      "Active Agents",
      activeAgentIds.length,
      activeAgentIds.length,
      previousActiveAgentIds.length,
      "vs last month",
    ),
  ];
}

async function buildEmployeeStats(filter: Record<string, unknown>): Promise<TDashboardStatDto[]> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(monthStart.getTime() - 1);
  const weekStart = startOfDay(addDays(now, -6));
  const previousWeekStart = startOfDay(addDays(weekStart, -7));
  const previousWeekEnd = new Date(weekStart.getTime() - 1);

  const [
    statusCounts,
    monthQuotations,
    previousMonthQuotations,
    weekPending,
    previousWeekPending,
    monthConfirmed,
    previousMonthConfirmed,
    weekDrafts,
    previousWeekDrafts,
  ] = await Promise.all([
    countByStatus(filter),
    countQuotationsBetween(filter, monthStart, now),
    countQuotationsBetween(filter, previousMonthStart, previousMonthEnd),
    Quotation.countDocuments({
      ...filter,
      status: QuotationStatus.PENDING,
      createdAt: { $gte: weekStart, $lte: now },
    }),
    Quotation.countDocuments({
      ...filter,
      status: QuotationStatus.PENDING,
      createdAt: { $gte: previousWeekStart, $lte: previousWeekEnd },
    }),
    Quotation.countDocuments({
      ...filter,
      status: QuotationStatus.CONFIRMED,
      createdAt: { $gte: monthStart, $lte: now },
    }),
    Quotation.countDocuments({
      ...filter,
      status: QuotationStatus.CONFIRMED,
      createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd },
    }),
    Quotation.countDocuments({
      ...filter,
      status: QuotationStatus.DRAFT,
      createdAt: { $gte: weekStart, $lte: now },
    }),
    Quotation.countDocuments({
      ...filter,
      status: QuotationStatus.DRAFT,
      createdAt: { $gte: previousWeekStart, $lte: previousWeekEnd },
    }),
  ]);

  const myQuotations =
    statusCounts[QuotationStatus.DRAFT] +
    statusCounts[QuotationStatus.PENDING] +
    statusCounts[QuotationStatus.CONFIRMED] +
    statusCounts[QuotationStatus.CANCELLED];

  return [
    buildStat(
      "myQuotations",
      "My Quotations",
      myQuotations,
      monthQuotations,
      previousMonthQuotations,
      "vs last month",
    ),
    buildStat(
      "pendingApproval",
      "Pending Approval",
      statusCounts[QuotationStatus.PENDING],
      weekPending,
      previousWeekPending,
      "vs last week",
    ),
    buildStat(
      "confirmedDeals",
      "Confirmed Deals",
      statusCounts[QuotationStatus.CONFIRMED],
      monthConfirmed,
      previousMonthConfirmed,
      "vs last month",
    ),
    buildStat(
      "drafts",
      "Drafts",
      statusCounts[QuotationStatus.DRAFT],
      weekDrafts,
      previousWeekDrafts,
      "vs last week",
    ),
  ];
}

function mapRecentQuotations(quotations: TPopulatedQuotation[]): TDashboardQuotationRowDto[] {
  return quotations.map((quotation) => ({
    id: String(quotation._id),
    reference: formatReference(quotation.referenceNumber),
    clientName: quotation.customerName,
    status: quotation.status,
    value: getQuotationTotalValue(quotation),
    currency: quotation.currency || "GBP",
  }));
}

async function buildRecentActivity(
  quotations: TPopulatedQuotation[],
  parseLogs: Array<{ _id: Types.ObjectId; parsedAt: Date; userId: { name: string } }>,
  actorNameForEmployee?: string,
): Promise<TDashboardActivityDto[]> {
  const quotationActivity: TDashboardActivityDto[] = quotations.map((quotation) => {
    const actorName = actorNameForEmployee ?? quotation.createdBy.name;
    const action =
      quotation.status === QuotationStatus.CONFIRMED
        ? "confirmed deal"
        : "created quotation";

    return {
      id: `quotation-${String(quotation._id)}`,
      actorName,
      actorInitials: initialsFromName(actorName),
      action,
      reference: formatReference(quotation.referenceNumber),
      createdAt: quotation.createdAt.toISOString(),
    };
  });

  const parseActivity: TDashboardActivityDto[] = parseLogs.map((log) => ({
    id: `parse-${String(log._id)}`,
    actorName: actorNameForEmployee ?? log.userId.name,
    actorInitials: initialsFromName(actorNameForEmployee ?? log.userId.name),
    action: "converted GDS itinerary",
    createdAt: log.parsedAt.toISOString(),
  }));

  return [...quotationActivity, ...parseActivity]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);
}

export const dashboardOverviewService = {
  async getOverview(req: Request): Promise<TDashboardOverviewDto> {
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId || !role) {
      throw new AppError(StatusCodes.UNAUTHORIZED, "Authentication required.");
    }

    const isAdmin = role === UserRole.ADMIN;
    const actorObjectId = isAdmin ? null : await resolveActorObjectId(userId);
    const filter = buildQuotationFilter(actorObjectId);
    const now = new Date();

    const weeklyBuckets = buildWeeklyTrendBuckets(now);
    const monthlyBuckets = buildMonthlyTrendBuckets(now);

    const [
      stats,
      recentQuotationsRaw,
      trendQuotations,
      recentParseLogs,
    ] = await Promise.all([
      isAdmin ? buildAdminStats(filter) : buildEmployeeStats(filter),
      Quotation.find(filter)
        .sort({ createdAt: -1 })
        .limit(6)
        .populate(CREATOR_POPULATE)
        .lean<TPopulatedQuotation[]>(),
      Quotation.find({
        ...filter,
        createdAt: { $gte: monthlyBuckets[0]?.start ?? startOfDay(addDays(now, -30)) },
      })
        .select("createdAt")
        .lean<Array<{ createdAt: Date }>>(),
      FlightConverterUsage.find(
        isAdmin
          ? {}
          : { userId: actorObjectId ?? undefined },
      )
        .sort({ parsedAt: -1 })
        .limit(4)
        .populate({ path: "userId", select: "name" })
        .lean<
          Array<{
            _id: Types.ObjectId;
            parsedAt: Date;
            userId: { name: string };
          }>
        >(),
    ]);

    const weeklyCounts = countInBuckets(trendQuotations, weeklyBuckets);
    const monthlyCounts = countInBuckets(trendQuotations, monthlyBuckets);

    const employeeActorName = !isAdmin
      ? (await User.findById(userId).select("name").lean())?.name
      : undefined;

    const recentActivity = await buildRecentActivity(
      recentQuotationsRaw,
      recentParseLogs,
      employeeActorName,
    );

    return {
      stats,
      quotationTrendWeekly: weeklyBuckets.map((bucket, index) => ({
        label: bucket.label,
        quotations: weeklyCounts[index] ?? 0,
      })),
      quotationTrendMonthly: monthlyBuckets.map((bucket, index) => ({
        label: bucket.label,
        quotations: monthlyCounts[index] ?? 0,
      })),
      recentActivity,
      recentQuotations: mapRecentQuotations(recentQuotationsRaw),
    };
  },
};
