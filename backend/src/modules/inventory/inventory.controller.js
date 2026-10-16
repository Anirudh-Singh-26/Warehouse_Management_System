import { Product } from "../products/product.model.js";
import { InventoryBalance } from "./inventoryBalance.model.js";
import { StockMovement } from "./stockMovement.model.js";
import { receiveStock, dispatchStock, adjustStock, disposeDamagedStock } from "./inventory.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getPagination, paginationMeta } from "../../utils/pagination.js";
import { ApiError } from "../../utils/apiError.js";


export const listInventory = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const productsFilter = {};

  if (req.query.search) {
    const term = String(req.query.search)
      .trim()
      .slice(0, 100)
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    productsFilter.$or = [
      { name: { $regex: term, $options: "i" } },
      { sku: { $regex: term, $options: "i" } },
    ];
  }

  const products = await Product.find(productsFilter)
    .select("_id sku name category reorderLevel status")
    .lean();

  const productIds = products.map((product) => product._id);
  const filter = { productId: { $in: productIds } };

  const [balances, total] = await Promise.all([
    InventoryBalance.find(filter)
      .populate("productId", "sku name category reorderLevel status")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit),

    InventoryBalance.countDocuments(filter),
  ]);

  let rows = balances.map((balance) => ({
    _id: balance._id,
    product: balance.productId,
    productId: balance.productId?._id,
    quantityOnHand: balance.quantityOnHand,
    quantityDamaged: balance.quantityDamaged,
    quantityReserved: balance.quantityReserved,
    availableQuantity: Math.max(
      0,
      balance.quantityOnHand - balance.quantityReserved,
    ),
    lowStock:
      balance.quantityOnHand - balance.quantityReserved <=
      (balance.productId?.reorderLevel ?? 0),
    updatedAt: balance.updatedAt,
  }));

  if (req.query.lowStock === "true") {
    rows = rows.filter((row) => row.lowStock);
  }

  res.json({
    success: true,
    data: rows,
    meta: paginationMeta(total, page, limit),
  });
});


export const getInventoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!/^[a-f\d]{24}$/i.test(id)) {
    throw new ApiError(400, "Invalid inventory balance ID");
  }

  const balance = await InventoryBalance.findById(id).populate(
    "productId",
    [
      "sku",
      "name",
      "description",
      "brand",
      "modelNumber",
      "barcode",
      "storageLocation",
      "weightKg",
      "lengthCm",
      "widthCm",
      "heightCm",
      "taxRatePercent",
      "minimumOrderQuantity",
      "warrantyMonths",
      "category",
      "unitOfMeasure",
      "costPrice",
      "sellingPrice",
      "reorderLevel",
      "status",
      "createdAt",
      "updatedAt",
    ].join(" "),
  );

  if (!balance) {
    throw new ApiError(404, "Inventory balance not found");
  }

  res.json({
    success: true,
    data: balance,
  });
});



export const getInventoryMovements = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.productId) {
    if (!/^[a-f\d]{24}$/i.test(String(req.query.productId))) throw new ApiError(400, "Invalid productId");
    filter.productId = req.query.productId;
  }
  if (req.query.type) {
    const allowed = ["RECEIPT", "DISPATCH", "ADJUSTMENT", "RETURN", "DAMAGE"];
    if (!allowed.includes(req.query.type)) throw new ApiError(400, "Invalid movement type");
    filter.type = req.query.type;
  }
  const [items, total] = await Promise.all([
    StockMovement.find(filter).populate("productId", "sku name").populate("performedBy", "name email role")
      .sort({ occurredAt: -1 }).skip(skip).limit(limit),
    StockMovement.countDocuments(filter)
  ]);
  res.json({ success: true, data: items, meta: paginationMeta(total, page, limit) });
});

export const receipt = asyncHandler(async (req, res) => {
  const result = await receiveStock(req.validatedBody, req.user);
  res.status(201).json({ success: true, data: result });
});

export const dispatch = asyncHandler(async (req, res) => {
  const result = await dispatchStock(req.validatedBody, req.user);
  res.status(201).json({ success: true, data: result });
});

export const adjustment = asyncHandler(async (req, res) => {
  const result = await adjustStock(req.validatedBody, req.user);
  res.status(201).json({ success: true, data: result });
});

export const damagedDisposition = asyncHandler(async (req, res) => {
  const result = await disposeDamagedStock(req.validatedBody, req.user);
  res.status(200).json({ success: true, data: result });
});
