import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  sku: { type: String, required: true, trim: true, uppercase: true, maxlength: 80, unique: true },
  name: { type: String, required: true, trim: true, maxlength: 180 },
  description: { type: String, trim: true, maxlength: 2000, default: "" },
  brand: { type: String, trim: true, maxlength: 120, default: "" },
  modelNumber: { type: String, trim: true, maxlength: 120, default: "" },
  barcode: { type: String, trim: true, maxlength: 100, default: "" },
  storageLocation: { type: String, trim: true, maxlength: 120, default: "" },
  weightKg: { type: Number, min: 0, default: 0 },
  lengthCm: { type: Number, min: 0, default: 0 },
  widthCm: { type: Number, min: 0, default: 0 },
  heightCm: { type: Number, min: 0, default: 0 },
  taxRatePercent: { type: Number, min: 0, max: 100, default: 0 },
  minimumOrderQuantity: { type: Number, min: 0, default: 0 },
  warrantyMonths: { type: Number, min: 0, default: 0 },
  category: { type: String, trim: true, maxlength: 100, default: "Uncategorized" },
  unitOfMeasure: { type: String, required: true, trim: true, lowercase: true, maxlength: 30, default: "piece" },
  costPrice: { type: Number, min: 0, default: 0 },
  sellingPrice: { type: Number, min: 0, default: 0 },
  reorderLevel: { type: Number, min: 0, default: 0 },
  status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true, versionKey: false });

productSchema.index({ name: "text", sku: "text", category: "text" });
productSchema.index({ status: 1, category: 1 });
productSchema.index({ barcode: 1 }, {
  unique: true,
  partialFilterExpression: { barcode: { $type: "string", $gt: "" } },
});

export const Product = mongoose.model("Product", productSchema);
