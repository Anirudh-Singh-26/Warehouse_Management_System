import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User } from "./user.model.js";
import { AuditLog } from "../audit/audit.model.js";
import { ApiError } from "../../utils/apiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getPagination, paginationMeta } from "../../utils/pagination.js";
import { ROLES } from "../../constants/roles.js";

const publicUser = user => ({
  id: user._id, name: user.name, email: user.email, role: user.role, status: user.status,
  employeeCode: user.employeeCode || "", phone: user.phone || "",
  department: user.department || "", jobTitle: user.jobTitle || "",
  joinedAt: user.joinedAt || null,
  lastLoginAt: user.lastLoginAt, createdAt: user.createdAt, updatedAt: user.updatedAt
});

export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (["ACTIVE", "INACTIVE"].includes(req.query.status)) filter.status = req.query.status;
  if (req.query.role && Object.values(ROLES).includes(req.query.role)) filter.role = req.query.role;
  if (req.query.search) {
    const q = String(req.query.search).trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { employeeCode: { $regex: q, $options: "i" } },
      { department: { $regex: q, $options: "i" } }
    ];
  }
  const [users, total] = await Promise.all([User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit), User.countDocuments(filter)]);
  res.json({ success: true, data: users.map(publicUser), meta: paginationMeta(total, page, limit) });
});

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, status, employeeCode, phone, department, jobTitle, joinedAt } = req.validatedBody;
  const existing = await User.findOne({ email }).select("_id");
  if (existing) throw new ApiError(409, "A user with this email already exists");
  const passwordHash = await bcrypt.hash(password, 12);
  let user;
  try { user = await User.create({
    name, email, passwordHash, role, status, employeeCode, phone, department, jobTitle,
    joinedAt: joinedAt ? new Date(joinedAt) : null
  }); }
  catch (error) {
    if (error?.code === 11000 && error?.keyPattern?.employeeCode) {
      throw new ApiError(409, "A user with this employee code already exists");
    }
    if (error?.code === 11000) throw new ApiError(409, "A user with this email already exists");
    throw error;
  }
  await AuditLog.create({ actorId: req.user._id, action: "USER_CREATED", entityType: "User", entityId: user._id, summary: `Created ${role} account for ${email}` });
  res.status(201).json({ success: true, data: publicUser(user) });
});

export const updateUser = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, "Invalid user ID");
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");
  const changes = req.validatedBody;
  if (user._id.equals(req.user._id) && changes.status === "INACTIVE") throw new ApiError(400, "You cannot deactivate your own account");
  if (user.role === ROLES.ADMIN && user.status === "ACTIVE" && (changes.status === "INACTIVE" || (changes.role && changes.role !== ROLES.ADMIN))) {
    const activeAdmins = await User.countDocuments({ role: ROLES.ADMIN, status: "ACTIVE" });
    if (activeAdmins <= 1) throw new ApiError(400, "You cannot deactivate or demote the last active administrator");
  }
  const trackedFields = ["name", "role", "status", "employeeCode", "phone", "department", "jobTitle", "joinedAt"];
  const before = Object.fromEntries(trackedFields.map((key) => [key, user[key] ?? null]));
  Object.assign(user, changes);
  if (changes.joinedAt !== undefined) user.joinedAt = changes.joinedAt ? new Date(changes.joinedAt) : null;
  try {
    await user.save();
  } catch (error) {
    if (error?.code === 11000 && error?.keyPattern?.employeeCode) {
      throw new ApiError(409, "A user with this employee code already exists");
    }
    throw error;
  }
  const after = Object.fromEntries(trackedFields.map((key) => [key, user[key] ?? null]));
  await AuditLog.create({
    actorId: req.user._id,
    action: "USER_UPDATED",
    entityType: "User",
    entityId: user._id,
    summary: `Updated account for ${user.email}`,
    metadata: { before, after }
  });
  res.json({ success: true, data: publicUser(user) });
});
