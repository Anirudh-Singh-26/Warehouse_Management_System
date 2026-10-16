import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/auth.js";
import { ROLES } from "../../constants/roles.js";
import { dashboardReport, inventoryValuation, productProfitability, stockMovementSummary, workforceCosts, bonusSummary, expenseSummary } from "./reports.controller.js";

const router = Router();
router.use(requireAuth);
const financeRoles = [ROLES.ADMIN, ROLES.FINANCE_VIEWER, ROLES.INVENTORY_MANAGER];
router.get("/dashboard", requireRoles(...financeRoles, ROLES.HR_MANAGER, ROLES.TRANSPORT_COORDINATOR), dashboardReport);
router.get("/inventory-valuation", requireRoles(...financeRoles), inventoryValuation);
router.get("/product-profitability", requireRoles(...financeRoles), productProfitability);
router.get("/stock-movements", requireRoles(...financeRoles), stockMovementSummary);
router.get("/workforce-costs", requireRoles(...financeRoles, ROLES.HR_MANAGER), workforceCosts);
router.get("/bonuses", requireRoles(ROLES.ADMIN, ROLES.FINANCE_VIEWER, ROLES.HR_MANAGER), bonusSummary);
router.get("/expenses", requireRoles(...financeRoles), expenseSummary);
export default router;
