import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.routes";
import { DashboardRoutes } from "../modules/dashboard/dashboard.routes";
import { AnalyticsRoutes } from "../modules/analytics/analytics.routes";

export const v1router = Router();

const moduleRoutes = [
  { path: "/auth", route: AuthRoutes },
  { path: "/dashboard", route: DashboardRoutes },
  { path: "/analytics", route: AnalyticsRoutes },
];

moduleRoutes.forEach((route) => {
  v1router.use(route.path, route.route);
});
