import mongoose from "mongoose";

const stockMovementSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
  type: {
    type: String,
    enum: ["RECEIPT", "DISPATCH", "ADJUSTMENT", "RETURN", "DAMAGE"],
    required: true
  },
  quantityDelta: { type: Number, required: true },
  acceptedQuantity: { type: Number, min: 0, default: 0 },
  damagedQuantity: { type: Number, min: 0, default: 0 },
  reference: { type: String, trim: true, maxlength: 120, default: "" },
  reason: { type: String, required: true, trim: true, maxlength: 500 },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  balanceAfter: { type: Number, min: 0, required: true },
  damagedBalanceAfter: { type: Number, min: 0, required: true },
  occurredAt: { type: Date, default: Date.now, immutable: true }
}, { versionKey: false });

stockMovementSchema.index({ productId: 1, occurredAt: -1 });
stockMovementSchema.index({ type: 1, occurredAt: -1 });
stockMovementSchema.index({ reference: 1 });

export const StockMovement = mongoose.model("StockMovement", stockMovementSchema);
