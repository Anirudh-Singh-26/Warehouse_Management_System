import { Product } from "./product.model.js";
import { InventoryBalance } from "../inventory/inventoryBalance.model.js";
import { AuditLog } from "../audit/audit.model.js";
import { ApiError } from "../../utils/apiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getPagination, paginationMeta } from "../../utils/pagination.js";

export const listProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.status && ["ACTIVE", "INACTIVE"].includes(req.query.status)) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.search) {
    const search = String(req.query.search).trim().slice(0, 100);
    filter.$or = [
      { sku: { $regex: escapeRegex(search), $options: "i" } },
      { name: { $regex: escapeRegex(search), $options: "i" } },
      { barcode: { $regex: escapeRegex(search), $options: "i" } },
      { brand: { $regex: escapeRegex(search), $options: "i" } }
    ];
  }
  const [items, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(filter)
  ]);
  res.json({ success: true, data: items, meta: paginationMeta(total, page, limit) });
});

export const createProduct = asyncHandler(async (req, res) => {
  let product;
  try {
    product = await Product.create({
      ...req.validatedBody,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });
  } catch (error) {
    if (error?.code === 11000 && error?.keyPattern?.barcode) {
      throw new ApiError(409, "A product with this barcode already exists");
    }
    throw error;
  }
  await InventoryBalance.create({ productId: product._id, updatedBy: req.user._id });
  await AuditLog.create({
    actorId: req.user._id, action: "PRODUCT_CREATED", entityType: "Product",
    entityId: product._id, summary: `Created product ${product.sku}`
  });
  res.status(201).json({ success: true, data: product });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");
  const inventory = await InventoryBalance.findOne({ productId: product._id });
  res.json({ success: true, data: { product, inventory } });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");
  const before = Object.fromEntries(Object.keys(req.validatedBody).map((key) => [key, product[key] ?? null]));
  Object.assign(product, req.validatedBody, { updatedBy: req.user._id });
  try {
    await product.save();
  } catch (error) {
    if (error?.code === 11000 && error?.keyPattern?.barcode) {
      throw new ApiError(409, "A product with this barcode already exists");
    }
    throw error;
  }
  const after = Object.fromEntries(Object.keys(req.validatedBody).map((key) => [key, product[key] ?? null]));
  await AuditLog.create({
    actorId: req.user._id, action: "PRODUCT_UPDATED", entityType: "Product",
    entityId: product._id, summary: `Updated product ${product.sku}`,
    metadata: { before, after }
  });
  res.json({ success: true, data: product });
});

export const deactivateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");
  product.status = "INACTIVE";
  product.updatedBy = req.user._id;
  await product.save();
  await AuditLog.create({
    actorId: req.user._id, action: "PRODUCT_DEACTIVATED", entityType: "Product",
    entityId: product._id, summary: `Deactivated product ${product.sku}`
  });
  res.json({ success: true, data: { id: product._id, status: product.status } });
});

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
