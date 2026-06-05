import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.routes";
import { DashboardRoutes } from "../modules/dashboard/dashboard.routes";
import { AnalyticsRoutes } from "../modules/analytics/analytics.routes";
import { FlightConverterRoutes } from "../modules/flight-converter/flight-converter.routes";
import { HotelCatalogRoutes } from "../modules/hotel-catalog/hotel-catalog.routes";
import { TransferCatalogRoutes } from "../modules/transfer-catalog/transfer-catalog.routes";
import { UsersRoutes } from "../modules/users/users.routes";

export const v1Router = Router();

const moduleRoutes = [
  { path: "/auth", route: AuthRoutes },
  { path: "/dashboard", route: DashboardRoutes },
  { path: "/analytics", route: AnalyticsRoutes },
  { path: "/users", route: UsersRoutes },
  { path: "/flight-converter", route: FlightConverterRoutes },
  { path: "", route: HotelCatalogRoutes },
  { path: "", route: TransferCatalogRoutes },
];

moduleRoutes.forEach((route) => {
  v1Router.use(route.path, route.route);
});
