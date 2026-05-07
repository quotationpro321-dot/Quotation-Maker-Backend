import { Router } from "express";
import { authController } from "./auth.controller";
import { validateRequest } from "../../middleware/validationRequest.middleware";
import { loginZodSchema } from "./auth.validation";

const router = Router();

router.post("/refresh-token", authController.getNewAccessTokenByRefreshToken);
router.post("/logout", authController.logout);
router.post("/login", validateRequest(loginZodSchema), authController.login);

export const AuthRoutes = router;
