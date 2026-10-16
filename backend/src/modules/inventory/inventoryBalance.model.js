import mongoose from "mongoose";

const inventoryBalanceSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, unique: true },
  quantityOnHand: { type: Number, min: 0, default: 0, required: true },
  quantityDamaged: { type: Number, min: 0, default: 0, required: true },
  quantityReserved: { type: Number, min: 0, default: 0, required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true, versionKey: false });

inventoryBalanceSchema.virtual("availableQuantity").get(function () {
  return Math.max(0, this.quantityOnHand - this.quantityReserved);
});

inventoryBalanceSchema.set("toJSON", { virtuals: true });
inventoryBalanceSchema.set("toObject", { virtuals: true });

export const InventoryBalance = mongoose.model("InventoryBalance", inventoryBalanceSchema);
