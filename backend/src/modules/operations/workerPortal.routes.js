import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/auth.js";
import { ROLES } from "../../constants/roles.js";
import { workerPortal, checkIn, checkOut, updateMyTaskStatus } from "./workerPortal.controller.js";

const router = Router();
router.use(requireAuth, requireRoles(ROLES.WORKER));
router.get("/me", workerPortal);
router.post("/attendance/check-in", checkIn);
router.post("/attendance/check-out", checkOut);
router.patch("/tasks/:id/status", updateMyTaskStatus);
export default router;
