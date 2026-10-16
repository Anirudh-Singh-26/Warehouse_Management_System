import mongoose from "mongoose";
import { ALL_ROLES, ROLES } from "../../constants/roles.js";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ALL_ROLES,
      default: ROLES.WORKER,
      required: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
      required: true,
    },
    // Optional employment identifiers are useful for warehouse staff accounts.
    employeeCode: { type: String, trim: true, uppercase: true, maxlength: 50, default: "" },
    phone: { type: String, trim: true, maxlength: 40, default: "" },
    department: { type: String, trim: true, maxlength: 100, default: "" },
    jobTitle: { type: String, trim: true, maxlength: 120, default: "" },
    joinedAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

userSchema.index({ role: 1, status: 1 });
userSchema.index({ employeeCode: 1 }, {
  unique: true,
  partialFilterExpression: { employeeCode: { $type: "string", $gt: "" } },
});

export const User = mongoose.model("User", userSchema);
