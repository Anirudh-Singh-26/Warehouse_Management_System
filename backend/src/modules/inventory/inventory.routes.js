import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/auth.js";
import { ROLES } from "../../constants/roles.js";
import { validateBody } from "../../middleware/validate.js";
import {
  receiptSchema,
  dispatchSchema,
  adjustmentSchema,
  damagedDispositionSchema,
} from "./inventory.schemas.js";

import {
  listInventory,
  getInventoryById,
  getInventoryMovements,
  receipt,
  dispatch,
  adjustment,
  damagedDisposition,
} from "./inventory.controller.js";

const router = Router();
router.use(requireAuth);
router.get("/", listInventory);
router.get("/movements", getInventoryMovements);

router.get("/", listInventory);
router.get("/movements", getInventoryMovements);
router.get("/:id", getInventoryById);

router.post(
  "/receipts",
  requireRoles(ROLES.ADMIN, ROLES.INVENTORY_MANAGER, ROLES.RECEIVING_STAFF),
  validateBody(receiptSchema),
  receipt,
);
router.post(
  "/dispatches",
  requireRoles(ROLES.ADMIN, ROLES.INVENTORY_MANAGER, ROLES.DISPATCH_STAFF),
  validateBody(dispatchSchema),
  dispatch,
);
router.post(
  "/adjustments",
  requireRoles(ROLES.ADMIN, ROLES.INVENTORY_MANAGER),
  validateBody(adjustmentSchema),
  adjustment,
);
router.post(
  "/damaged-stock/disposition",
  requireRoles(ROLES.ADMIN, ROLES.INVENTORY_MANAGER),
  validateBody(damagedDispositionSchema),
  damagedDisposition,
);
export default router;
