import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/auth.js";
import { ROLES } from "../../constants/roles.js";
import { AuditLog } from "./audit.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getPagination, paginationMeta } from "../../utils/pagination.js";
import mongoose from "mongoose";

const router = Router();
router.use(requireAuth, requireRoles(ROLES.ADMIN));
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (req.query.action) filter.action = String(req.query.action).slice(0, 80);
    if (req.query.entityType)
      filter.entityType = String(req.query.entityType).slice(0, 80);
    const [data, total] = await Promise.all([
      AuditLog.find(filter)
        .populate("actorId", "name email role")
        .sort({ occurredAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);
    res.json({ success: true, data, meta: paginationMeta(total, page, limit) });
  }),
);
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: { message: "Invalid audit record ID" },
      });
    }

    const record = await AuditLog.findById(id)
      .populate("actorId", "name email role")
      .lean();

    if (!record) {
      return res.status(404).json({
        success: false,
        error: { message: "Audit record not found" },
      });
    }

    res.json({ success: true, data: record });
  }),
);
export default router;
