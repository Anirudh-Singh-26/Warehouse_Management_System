import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/auth.js";
import { ROLES } from "../../constants/roles.js";
import { validateBody } from "../../middleware/validate.js";
import { createUserSchema, updateUserSchema } from "./users.schemas.js";
import { listUsers, createUser, updateUser } from "./users.controller.js";

const router = Router();
router.use(requireAuth, requireRoles(ROLES.ADMIN));
router.get("/", listUsers);
router.post("/", validateBody(createUserSchema), createUser);
router.patch("/:id", validateBody(updateUserSchema), updateUser);
export default router;
