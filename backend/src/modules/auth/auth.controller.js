import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../users/user.model.js";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/apiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    path: "/",
    maxAge: 24 * 60 * 60 * 1000
  };
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status
  };
}

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validatedBody;
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user || user.status !== "ACTIVE") throw new ApiError(401, "Invalid email or password");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new ApiError(401, "Invalid email or password");

  user.lastLoginAt = new Date();
  await user.save();

  const token = jwt.sign({ sub: user._id.toString(), role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
  res.cookie(env.COOKIE_NAME, token, cookieOptions());
  res.json({ success: true, data: { user: publicUser(user) } });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie(env.COOKIE_NAME, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    path: "/"
  });
  res.json({ success: true, data: { message: "Logged out successfully" } });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: publicUser(req.user) } });
});


export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.validatedBody;
  const user = await User.findById(req.user._id).select("+passwordHash");
  if (!user || user.status !== "ACTIVE") throw new ApiError(401, "User is unavailable");
  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) throw new ApiError(400, "Current password is incorrect");
  if (await bcrypt.compare(newPassword, user.passwordHash)) {
    throw new ApiError(400, "Choose a password different from your current password");
  }
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();
  const { AuditLog } = await import("../audit/audit.model.js");
  await AuditLog.create({
    actorId: user._id, action: "PASSWORD_CHANGED", entityType: "User", entityId: user._id,
    summary: `Password changed for account ${user.email}`
  });
  res.json({ success: true, data: { message: "Password changed successfully" } });
});
