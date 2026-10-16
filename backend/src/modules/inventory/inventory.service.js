import mongoose from "mongoose";
import { Product } from "../products/product.model.js";
import { InventoryBalance } from "./inventoryBalance.model.js";
import { StockMovement } from "./stockMovement.model.js";
import { AuditLog } from "../audit/audit.model.js";
import { ApiError } from "../../utils/apiError.js";

async function assertActiveProduct(productId, session) {
  const product = await Product.findOne({ _id: productId, status: "ACTIVE" }).session(session);
  if (!product) throw new ApiError(404, "Active product not found");
  return product;
}

async function ensureBalance(productId, userId, session) {
  let balance = await InventoryBalance.findOne({ productId }).session(session);
  if (!balance) {
    const created = await InventoryBalance.create([{ productId, updatedBy: userId }], { session });
    balance = created[0];
  }
  return balance;
}

export async function receiveStock(input, user) {
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      await assertActiveProduct(input.productId, session);
      const balance = await ensureBalance(input.productId, user._id, session);
      balance.quantityOnHand += input.acceptedQuantity;
      balance.quantityDamaged += input.damagedQuantity;
      balance.updatedBy = user._id;
      await balance.save({ session });

      const [movement] = await StockMovement.create([{
        productId: input.productId,
        type: "RECEIPT",
        quantityDelta: input.acceptedQuantity,
        acceptedQuantity: input.acceptedQuantity,
        damagedQuantity: input.damagedQuantity,
        reference: input.reference,
        reason: input.reason,
        performedBy: user._id,
        balanceAfter: balance.quantityOnHand,
        damagedBalanceAfter: balance.quantityDamaged
      }], { session });

      await AuditLog.create([{
        actorId: user._id, action: "STOCK_RECEIVED", entityType: "InventoryBalance",
        entityId: balance._id, summary: `Received ${input.acceptedQuantity} accepted and ${input.damagedQuantity} damaged units`,
        metadata: { productId: input.productId, movementId: movement._id, reference: input.reference }
      }], { session });
      result = { balance, movement };
    });
  } finally {
    await session.endSession();
  }
  return result;
}

export async function dispatchStock(input, user) {
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      await assertActiveProduct(input.productId, session);
      const balance = await InventoryBalance.findOne({ productId: input.productId }).session(session);
      if (!balance) throw new ApiError(409, "No inventory balance exists for this product");
      const available = balance.quantityOnHand - balance.quantityReserved;
      if (available < input.quantity) throw new ApiError(409, `Insufficient available stock. Available: ${available}`);

      // Conditional update protects against two dispatches consuming the same stock.
      const updated = await InventoryBalance.findOneAndUpdate(
        { _id: balance._id, quantityOnHand: { $gte: input.quantity + balance.quantityReserved } },
        { $inc: { quantityOnHand: -input.quantity }, $set: { updatedBy: user._id } },
        { new: true, session, runValidators: true }
      );
      if (!updated) throw new ApiError(409, "Stock changed during dispatch; refresh and retry");

      const [movement] = await StockMovement.create([{
        productId: input.productId, type: "DISPATCH", quantityDelta: -input.quantity,
        reference: input.reference, reason: input.reason, performedBy: user._id,
        balanceAfter: updated.quantityOnHand, damagedBalanceAfter: updated.quantityDamaged
      }], { session });
      await AuditLog.create([{
        actorId: user._id, action: "STOCK_DISPATCHED", entityType: "InventoryBalance",
        entityId: updated._id, summary: `Dispatched ${input.quantity} units`,
        metadata: { productId: input.productId, movementId: movement._id, reference: input.reference }
      }], { session });
      result = { balance: updated, movement };
    });
  } finally {
    await session.endSession();
  }
  return result;
}

export async function adjustStock(input, user) {
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      await assertActiveProduct(input.productId, session);
      const balance = await ensureBalance(input.productId, user._id, session);
      const nextQuantity = balance.quantityOnHand + input.quantityDelta;
      if (nextQuantity < balance.quantityReserved || nextQuantity < 0) {
        throw new ApiError(409, "Adjustment cannot reduce stock below reserved quantity or zero");
      }
      balance.quantityOnHand = nextQuantity;
      balance.updatedBy = user._id;
      await balance.save({ session });

      const [movement] = await StockMovement.create([{
        productId: input.productId, type: "ADJUSTMENT", quantityDelta: input.quantityDelta,
        reference: input.reference, reason: input.reason, performedBy: user._id,
        balanceAfter: balance.quantityOnHand, damagedBalanceAfter: balance.quantityDamaged
      }], { session });
      await AuditLog.create([{
        actorId: user._id, action: "STOCK_ADJUSTED", entityType: "InventoryBalance",
        entityId: balance._id, summary: `Adjusted stock by ${input.quantityDelta}`,
        metadata: { productId: input.productId, movementId: movement._id, reference: input.reference }
      }], { session });
      result = { balance, movement };
    });
  } finally {
    await session.endSession();
  }
  return result;
}

export async function recordReturnedStock(input, user) {
  // Returned goods are quarantined as damaged/inspection stock until an authorized
  // person checks quality; they are not added to sellable quantityOnHand.
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      await assertActiveProduct(input.productId, session);
      const balance = await ensureBalance(input.productId, user._id, session);
      balance.quantityDamaged += input.quantity;
      balance.updatedBy = user._id;
      await balance.save({ session });

      const [movement] = await StockMovement.create([{
        productId: input.productId, type: "RETURN", quantityDelta: 0,
        acceptedQuantity: 0, damagedQuantity: input.quantity, reference: input.reference,
        reason: input.reason, performedBy: user._id, balanceAfter: balance.quantityOnHand,
        damagedBalanceAfter: balance.quantityDamaged
      }], { session });
      await AuditLog.create([{
        actorId: user._id, action: "STOCK_RETURNED", entityType: "InventoryBalance",
        entityId: balance._id, summary: `Recorded ${input.quantity} returned units for inspection`,
        metadata: { productId: input.productId, movementId: movement._id, reference: input.reference }
      }], { session });
      result = { balance, movement };
    });
  } finally {
    await session.endSession();
  }
  return result;
}

export async function disposeDamagedStock(input, user) {
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      await assertActiveProduct(input.productId, session);
      const balance = await InventoryBalance.findOne({ productId: input.productId }).session(session);
      if (!balance || balance.quantityDamaged < input.quantity) {
        throw new ApiError(409, `Insufficient damaged stock. Available: ${balance?.quantityDamaged ?? 0}`);
      }
      balance.quantityDamaged -= input.quantity;
      if (input.action === "RELEASE") balance.quantityOnHand += input.quantity;
      balance.updatedBy = user._id;
      await balance.save({ session });
      const [movement] = await StockMovement.create([{
        productId: input.productId, type: input.action === "WRITE_OFF" ? "DAMAGE" : "ADJUSTMENT",
        quantityDelta: input.action === "RELEASE" ? input.quantity : 0,
        acceptedQuantity: input.action === "RELEASE" ? input.quantity : 0,
        damagedQuantity: input.quantity, reference: input.reference,
        reason: `${input.action}: ${input.reason}`, performedBy: user._id,
        balanceAfter: balance.quantityOnHand, damagedBalanceAfter: balance.quantityDamaged
      }], { session });
      await AuditLog.create([{
        actorId: user._id, action: input.action === "RELEASE" ? "DAMAGED_STOCK_RELEASED" : "DAMAGED_STOCK_WRITTEN_OFF",
        entityType: "InventoryBalance", entityId: balance._id,
        summary: `${input.action} ${input.quantity} damaged units`,
        metadata: { productId: input.productId, movementId: movement._id, reference: input.reference, reason: input.reason }
      }], { session });
      result = { balance, movement };
    });
  } finally {
    await session.endSession();
  }
  return result;
}
