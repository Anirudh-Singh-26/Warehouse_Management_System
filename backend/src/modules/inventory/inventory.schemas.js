import { z } from "zod";

const id = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ID");
const qty = z.number().finite().positive().max(1_000_000_000);
const reference = z.string().trim().max(120).optional().default("");
const reason = z.string().trim().min(3).max(500);

export const receiptSchema = z.object({
  productId: id,
  acceptedQuantity: z.number().finite().min(0).max(1_000_000_000),
  damagedQuantity: z.number().finite().min(0).max(1_000_000_000).optional().default(0),
  reference,
  reason: reason.optional().default("Goods received")
}).refine(v => v.acceptedQuantity + v.damagedQuantity > 0, {
  message: "At least one of acceptedQuantity or damagedQuantity must be greater than zero"
});

export const dispatchSchema = z.object({
  productId: id,
  quantity: qty,
  reference,
  reason: reason.optional().default("Stock dispatched")
});

export const adjustmentSchema = z.object({
  productId: id,
  quantityDelta: z
    .number()
    .finite()
    .max(1_000_000_000)
    .min(-1_000_000_000)
    .refine((v) => v !== 0, "quantityDelta must not be zero"),
  reason,
  reference,
});

export const damagedDispositionSchema = z.object({
  productId: id,
  quantity: qty,
  action: z.enum(["RELEASE", "WRITE_OFF"]),
  reason,
  reference
});
