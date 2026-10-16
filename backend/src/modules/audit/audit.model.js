import mongoose from "mongoose";

const auditSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true, maxlength: 80 },
  entityType: { type: String, required: true, maxlength: 80 },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  summary: { type: String, required: true, maxlength: 500 },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  occurredAt: { type: Date, default: Date.now, immutable: true }
}, { versionKey: false });

auditSchema.index({ entityType: 1, entityId: 1, occurredAt: -1 });
auditSchema.index({ actorId: 1, occurredAt: -1 });

export const AuditLog = mongoose.model("AuditLog", auditSchema);
