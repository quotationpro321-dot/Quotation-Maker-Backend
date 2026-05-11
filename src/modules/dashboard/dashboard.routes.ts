import { Router } from "express";
import { dashboardController } from "./dashboard.controller";
import { checkAuth } from "../../middleware/checkAuth.middleware";
import { UserRole } from "../user/user.types";

const router = Router();

router.get("/stats", checkAuth(UserRole.ADMIN), dashboardController.getStats);

export const DashboardRoutes = router;
