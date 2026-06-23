export type TDashboardStatDto = {
  key: string;
  label: string;
  value: number;
  trendPercent?: number;
  trendLabel?: string;
};

export type TQuotationTrendPointDto = {
  label: string;
  quotations: number;
};

export type TDashboardActivityDto = {
  id: string;
  actorName: string;
  actorInitials: string;
  action: string;
  reference?: string;
  createdAt: string;
};

export type TDashboardQuotationRowDto = {
  id: string;
  reference: string;
  clientName: string;
  status: "draft" | "pending" | "confirmed" | "cancelled";
  value: number;
  currency: string;
};

export type TDashboardOverviewDto = {
  stats: TDashboardStatDto[];
  quotationTrendWeekly: TQuotationTrendPointDto[];
  quotationTrendMonthly: TQuotationTrendPointDto[];
  recentActivity: TDashboardActivityDto[];
  recentQuotations: TDashboardQuotationRowDto[];
};

export type TAnalyticsPeriod = "7d" | "30d" | "90d" | "12m";

export type TAnalyticsKpiDto = {
  key: string;
  label: string;
  value: number;
  trendPercent?: number;
  trendLabel?: string;
  format?: "number" | "currency" | "percent";
};

export type TAnalyticsTrendPointDto = {
  label: string;
  quotations: number;
  revenue: number;
};

export type TAnalyticsStatusSliceDto = {
  status: "draft" | "pending" | "confirmed" | "cancelled";
  count: number;
};

export type TAnalyticsAgentRowDto = {
  id: string;
  name: string;
  quotations: number;
  confirmed: number;
  revenue: number;
  currency: string;
};

export type TAnalyticsFlightUsagePointDto = {
  label: string;
  parses: number;
};

export type TAnalyticsOverviewDto = {
  kpis: TAnalyticsKpiDto[];
  quotationVolume: TAnalyticsTrendPointDto[];
  revenueTrend: TAnalyticsTrendPointDto[];
  statusBreakdown: TAnalyticsStatusSliceDto[];
  topAgents: TAnalyticsAgentRowDto[];
  flightConverterUsage: TAnalyticsFlightUsagePointDto[];
};
