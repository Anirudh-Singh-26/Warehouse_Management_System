import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { ROLES } from "../../constants/roles.js";
import {
  supplierSchema,
  providerSchema,
  vehicleSchema,
  driverSchema,
  workerSchema,
  attendanceSchema,
  taskSchema,
  bonusSchema,
  shipmentSchema,
  shipmentStatusSchema,
  taskStatusSchema,
  bonusApprovalSchema,
  staffingAgencySchema,
  expenseSchema,
} from "./schemas.js";
import {
  listResource,
  createResource,
  getResource,
  updateResource,
  deleteResource,
  updateShipmentStatus,
  updateTaskStatus,
  updateBonusApproval,
} from "./operations.controller.js";

const router = Router();

router.use(requireAuth);

const schemas = {
  suppliers: supplierSchema,
  "transport-providers": providerSchema,
  vehicles: vehicleSchema,
  drivers: driverSchema,
  workers: workerSchema,
  attendance: attendanceSchema,
  tasks: taskSchema,
  "bonus-records": bonusSchema,
  shipments: shipmentSchema,
  "staffing-agencies": staffingAgencySchema,
  expenses: expenseSchema,
};

const managerRoles = [
  ROLES.ADMIN,
  ROLES.INVENTORY_MANAGER,
  ROLES.TRANSPORT_COORDINATOR,
];

const shipmentRoles = [
  ROLES.ADMIN,
  ROLES.INVENTORY_MANAGER,
  ROLES.DISPATCH_STAFF,
  ROLES.TRANSPORT_COORDINATOR,
];

const peopleRoles = [ROLES.ADMIN, ROLES.HR_MANAGER];

const resourceRole = {
  suppliers: [
    ...managerRoles,
    ROLES.RECEIVING_STAFF,
  ],
  "transport-providers": managerRoles,
  vehicles: managerRoles,
  drivers: managerRoles,
  shipments: shipmentRoles,
  workers: peopleRoles,
  attendance: peopleRoles,
  tasks: [
    ROLES.ADMIN,
    ROLES.HR_MANAGER,
    ROLES.INVENTORY_MANAGER,
  ],
  "bonus-records": [ROLES.ADMIN, ROLES.HR_MANAGER],
  "staffing-agencies": [ROLES.ADMIN, ROLES.HR_MANAGER],
  expenses: [
    ROLES.ADMIN,
    ROLES.FINANCE_VIEWER,
  ],
};

const schemaFor = (partial = false) => (req, res, next) => {
  const schema = schemas[req.params.resource];

  if (!schema) return next();

  return validateBody(
    partial ? schema.partial() : schema
  )(req, res, next);
};

const authorizeResource = (req, res, next) => {
  const roles = resourceRole[req.params.resource];

  if (!roles) return next();

  return requireRoles(...roles)(req, res, next);
};

// Editing master data is deliberately narrower than viewing or creating it.
// Workflow and historical records must use their dedicated action endpoints.
const editRole = {
  suppliers: [ROLES.ADMIN, ROLES.INVENTORY_MANAGER],
  "transport-providers": [
    ROLES.ADMIN,
    ROLES.TRANSPORT_COORDINATOR,
  ],
  vehicles: [
    ROLES.ADMIN,
    ROLES.TRANSPORT_COORDINATOR,
  ],
  drivers: [
    ROLES.ADMIN,
    ROLES.TRANSPORT_COORDINATOR,
  ],
  workers: [ROLES.ADMIN, ROLES.HR_MANAGER],
};

const authorizeEditResource = (req, res, next) => {
  const roles =
    req.params.resource === "products"
      ? [ROLES.ADMIN, ROLES.INVENTORY_MANAGER]
      : editRole[req.params.resource];

  if (!roles) {
    return res.status(403).json({
      success: false,
      error: {
        message:
          "Direct editing is disabled for this record type. Use its workflow action instead.",
      },
    });
  }

  return requireRoles(...roles)(req, res, next);
};

router.patch(
  "/shipments/:id/status",
  requireRoles(...shipmentRoles),
  validateBody(shipmentStatusSchema),
  updateShipmentStatus
);

router.patch(
  "/tasks/:id/status",
  requireRoles(
    ...peopleRoles,
    ROLES.INVENTORY_MANAGER
  ),
  validateBody(taskStatusSchema),
  updateTaskStatus
);

router.patch(
  "/bonus-records/:id/approval",
  requireRoles(...peopleRoles),
  validateBody(bonusApprovalSchema),
  updateBonusApproval
);

router.get("/:resource", authorizeResource, listResource);

router.post(
  "/:resource",
  authorizeResource,
  schemaFor(false),
  createResource
);

router.get(
  "/:resource/:id",
  authorizeResource,
  getResource
);

router.patch(
  "/:resource/:id",
  authorizeEditResource,
  schemaFor(true),
  updateResource
);

router.delete(
  "/:resource/:id",
  requireRoles(ROLES.ADMIN),
  authorizeResource,
  deleteResource
);

export default router;

