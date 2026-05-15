import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.routes";
import { DashboardRoutes } from "../modules/dashboard/dashboard.routes";
import { AnalyticsRoutes } from "../modules/analytics/analytics.routes";
import { UsersRoutes } from "../modules/users/users.routes";

export const v1Router = Router();

const moduleRoutes = [
  { path: "/auth", route: AuthRoutes },
  { path: "/dashboard", route: DashboardRoutes },
  { path: "/analytics", route: AnalyticsRoutes },
  { path: "/users", route: UsersRoutes },
];

moduleRoutes.forEach((route) => {
  v1Router.use(route.path, route.route);
});
