import { Router } from "express";
import { login, logout, me, changePassword } from "./auth.controller.js";
import { validateBody } from "../../middleware/validate.js";
import { loginSchema, changePasswordSchema } from "./auth.schemas.js";
import { requireAuth } from "../../middleware/auth.js";

const router = Router();
router.post("/login", validateBody(loginSchema), login);
router.post("/logout", logout);
router.get("/me", requireAuth, me);
router.post("/change-password", requireAuth, validateBody(changePasswordSchema), changePassword);
export default router;
