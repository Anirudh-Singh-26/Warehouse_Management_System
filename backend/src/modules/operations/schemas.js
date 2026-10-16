import { z } from "zod";
const id = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ID");
const short = (max=180) => z.string().trim().min(1).max(max);
const optionalText = (max=1000) => z.string().trim().max(max).optional().default("");
const nonnegative = z.number().finite().min(0).max(1_000_000_000);
const optionalUrl = (max = 1000) =>
  z.string().trim().url().max(max).optional().or(z.literal("")).default("");

export const supplierSchema = z.object({
  code: short(50), name: short(), contactName: optionalText(160), phone: optionalText(40),
  email: z.string().trim().email().max(254).optional().or(z.literal("")).default(""),
  address: optionalText(), billingAddress: optionalText(),
  gstin: z.string().trim().max(15).optional().default(""),
  website: optionalUrl(300),
  paymentTermsDays: z.number().int().min(0).max(365).optional().default(0),
  status: z.enum(["ACTIVE","INACTIVE"]).optional().default("ACTIVE"), notes: optionalText()
});
export const providerSchema = z.object({
  code: short(50), name: short(), type: z.enum(["COURIER","TRANSPORTER","THIRD_PARTY"]).optional().default("COURIER"),
  contactName: optionalText(160), phone: optionalText(40),
  email: z.string().trim().email().max(254).optional().or(z.literal("")).default(""),
  trackingUrlTemplate: optionalText(500),
  website: optionalUrl(300), status: z.enum(["ACTIVE","INACTIVE"]).optional().default("ACTIVE"), notes: optionalText()
});
export const vehicleSchema = z.object({
  registrationNumber: short(30), vehicleType: z.enum(["VAN","TRUCK","BIKE","CAR","OTHER"]).optional().default("VAN"),
  capacityKg: nonnegative.optional().default(0),
  make: optionalText(100), model: optionalText(100),
  manufacturingYear: z.number().int().min(1950).max(2100).nullable().optional(),
  fuelType: z.enum(["DIESEL","PETROL","CNG","ELECTRIC","HYBRID","OTHER",""]).optional().default(""),
  insuranceExpiry: z.string().datetime().nullable().optional(),
  permitExpiry: z.string().datetime().nullable().optional(),
  fitnessExpiry: z.string().datetime().nullable().optional(),
  lastServiceAt: z.string().datetime().nullable().optional(),
  nextServiceDueAt: z.string().datetime().nullable().optional(),
  odometerKm: nonnegative.optional().default(0), status: z.enum(["AVAILABLE","IN_USE","MAINTENANCE","INACTIVE"]).optional().default("AVAILABLE"), notes: optionalText()
});
export const driverSchema = z.object({
  name: short(160), phone: short(40), licenseNumber: short(80), licenseExpiry: z.string().datetime().optional().nullable(),
  licenseClass: optionalText(80),
  employmentType: z.enum(["EMPLOYEE","CONTRACTOR","AGENCY"]).optional().default("EMPLOYEE"),
  agencyName: optionalText(180),
  status: z.enum(["AVAILABLE","ASSIGNED","INACTIVE"]).optional().default("AVAILABLE"), notes: optionalText()
});
export const workerSchema = z.object({
  workerCode: short(50), name: short(160), phone: optionalText(40),
  email: z.string().trim().email().max(254).optional().or(z.literal("")).default(""),
  employmentType: z.enum(["EMPLOYEE","CONTRACTOR","AGENCY"]).optional().default("EMPLOYEE"),
  agencyName: optionalText(180), jobTitle: optionalText(100).default("Warehouse Worker"),
  dailyRate: nonnegative.optional().default(0),
  shift: z.enum(["GENERAL","MORNING","EVENING","NIGHT",""]).optional().default(""),
  contractEndAt: z.string().datetime().nullable().optional(),
  status: z.enum(["ACTIVE","INACTIVE"]).optional().default("ACTIVE"),
  joinedAt: z.string().datetime().optional(), notes: optionalText()
});
export const attendanceSchema = z.object({
  workerId: id, date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["PRESENT","ABSENT","HALF_DAY","LEAVE"]).optional().default("PRESENT"),
  checkIn: z.string().datetime().optional().nullable(), checkOut: z.string().datetime().optional().nullable(),
  hoursWorked: nonnegative.max(24).optional().default(0),
  breakMinutes: z.number().int().min(0).max(1440).optional().default(0),
  overtimeHours: nonnegative.max(24).optional().default(0), notes: optionalText()
}).refine(v => !v.checkIn || !v.checkOut || new Date(v.checkOut) >= new Date(v.checkIn), "checkOut must be after checkIn");
export const taskSchema = z.object({
  taskCode: short(60), title: short(), description: optionalText(2000), workerId: id.optional().nullable(),
  priority: z.enum(["LOW","MEDIUM","HIGH","URGENT"]).optional().default("MEDIUM"),
  dueDate: z.string().datetime().optional().nullable()
});
export const bonusSchema = z.object({
  workerId: id, periodStart: z.string().datetime(), periodEnd: z.string().datetime(),
  tasksCompleted: nonnegative.optional().default(0), attendanceDays: nonnegative.optional().default(0),
  eligible: z.boolean().optional().default(false), amount: nonnegative.optional().default(0),
  criteria: optionalText()
}).refine(v => new Date(v.periodEnd) >= new Date(v.periodStart), "periodEnd must be on or after periodStart");
export const shipmentSchema = z.object({
  shipmentCode: short(80), orderReference: optionalText(120), customerName: optionalText(180),
  recipientPhone: optionalText(40),
  recipientEmail: z.string().trim().email().max(254).optional().or(z.literal("")).default(""),
  originAddress: optionalText(), destinationAddress: optionalText(),
  packageWeightKg: nonnegative.optional().default(0),
  shippingCost: nonnegative.optional().default(0),
  expectedDeliveryAt: z.string().datetime().nullable().optional(),
  trackingUrl: optionalUrl(1000),
  productId: id, quantity: z.number().int().positive().max(1_000_000),
  transportProviderId: id.optional().nullable(), vehicleId: id.optional().nullable(), driverId: id.optional().nullable(),
  trackingNumber: optionalText(120), notes: optionalText()
});
export const shipmentStatusSchema = z.object({
  status: z.enum(["READY","DISPATCHED","IN_TRANSIT","DELIVERED","FAILED","RETURNED","CANCELLED"]),
  notes: optionalText(),
  location: optionalText(240)
});
export const taskStatusSchema = z.object({
  status: z.enum(["PENDING","IN_PROGRESS","COMPLETED","CANCELLED"])
});

export const bonusApprovalSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  approvalNote: optionalText()
});


export const staffingAgencySchema = z.object({
  code: short(50), name: short(180), contactName: optionalText(160), phone: optionalText(40),
  email: z.string().trim().email().max(254).optional().or(z.literal("")).default(""),
  contractReference: optionalText(120), status: z.enum(["ACTIVE", "INACTIVE"]).optional().default("ACTIVE"), notes: optionalText()
});
export const expenseSchema = z.object({
  expenseCode: short(60), category: z.enum(["TRANSPORT", "HANDLING", "PACKAGING", "REPAIR", "UTILITIES", "CONTRACT_LABOUR", "DAMAGE_WRITE_OFF", "OTHER"]),
  amount: z.number().finite().positive().max(1_000_000_000), expenseDate: z.string().datetime(), reference: optionalText(120),
  shipmentId: id.optional().nullable(), supplierName: optionalText(180), description: optionalText()
});
