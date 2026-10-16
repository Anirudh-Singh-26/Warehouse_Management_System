import { z } from "zod";

const money = z.number().finite().min(0).max(1_000_000_000);
const nonNegative = z.number().finite().min(0).max(1_000_000_000);

export const createProductSchema = z.object({
  sku: z.string().trim().min(1).max(80).regex(/^[a-zA-Z0-9._-]+$/, "SKU may contain letters, numbers, dot, underscore, and hyphen"),
  name: z.string().trim().min(1).max(180),
  description: z.string().trim().max(2000).optional().default(""),
  brand: z.string().trim().max(120).optional().default(""),
  modelNumber: z.string().trim().max(120).optional().default(""),
  barcode: z.string().trim().max(100).optional().default(""),
  storageLocation: z.string().trim().max(120).optional().default(""),
  weightKg: nonNegative.optional().default(0),
  lengthCm: nonNegative.optional().default(0),
  widthCm: nonNegative.optional().default(0),
  heightCm: nonNegative.optional().default(0),
  taxRatePercent: z.number().finite().min(0).max(100).optional().default(0),
  minimumOrderQuantity: nonNegative.optional().default(0),
  warrantyMonths: z.number().int().min(0).max(1200).optional().default(0),
  category: z.string().trim().max(100).optional().default("Uncategorized"),
  unitOfMeasure: z.string().trim().min(1).max(30).optional().default("piece"),
  costPrice: money.optional().default(0),
  sellingPrice: money.optional().default(0),
  reorderLevel: nonNegative.optional().default(0)
});

export const updateProductSchema = createProductSchema.partial().refine(
  value => Object.keys(value).length > 0,
  "Provide at least one field to update"
);
