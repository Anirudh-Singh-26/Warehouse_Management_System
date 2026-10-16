import { z } from "zod";
import { ALL_ROLES } from "../../constants/roles.js";

const profileFields = {
  employeeCode: z.string().trim().max(50).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  department: z.string().trim().max(100).optional().default(""),
  jobTitle: z.string().trim().max(120).optional().default(""),
  joinedAt: z.string().datetime().optional().nullable(),
};

export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).transform(v => v.toLowerCase()),
  password: z.string().min(10).max(200),
  role: z.enum(ALL_ROLES),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional().default("ACTIVE"),
  ...profileFields,
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  role: z.enum(ALL_ROLES).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  employeeCode: z.string().trim().max(50).optional(),
  phone: z.string().trim().max(40).optional(),
  department: z.string().trim().max(100).optional(),
  jobTitle: z.string().trim().max(120).optional(),
  joinedAt: z.string().datetime().optional().nullable(),
}).refine(value => Object.keys(value).length > 0, {
  message: "At least one field is required",
});
