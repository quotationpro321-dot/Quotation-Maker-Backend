import { Router } from "express";
import { dashboardController } from "./dashboard.controller";
import { checkAuth } from "../../middleware/checkAuth.middleware";
import { Role } from "../user/user.types";

const router = Router();

router.get("/stats", checkAuth(Role.ADMIN), dashboardController.getStats);

export const DashboardRoutes = router;
