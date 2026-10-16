import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/auth.js";
import { ROLES } from "../../constants/roles.js";
import { validateBody } from "../../middleware/validate.js";
import { createProductSchema, updateProductSchema } from "./product.schemas.js";
import { listProducts, createProduct, getProduct, updateProduct, deactivateProduct } from "./product.controller.js";

const router = Router();
router.use(requireAuth);
router.get("/", listProducts);
router.post("/", requireRoles(ROLES.ADMIN, ROLES.INVENTORY_MANAGER), validateBody(createProductSchema), createProduct);
router.get("/:id", getProduct);
router.patch("/:id", requireRoles(ROLES.ADMIN, ROLES.INVENTORY_MANAGER), validateBody(updateProductSchema), updateProduct);
router.patch("/:id/deactivate", requireRoles(ROLES.ADMIN), deactivateProduct);
export default router;
