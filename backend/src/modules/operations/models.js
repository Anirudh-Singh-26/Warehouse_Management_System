import mongoose from "mongoose";

const options = { timestamps: true, versionKey: false };
const contact = {
  contactName: { type: String, trim: true, maxlength: 160, default: "" },
  phone: { type: String, trim: true, maxlength: 40, default: "" },
  email: { type: String, trim: true, lowercase: true, maxlength: 254, default: "" }
};

function model(name, fields, indexes = []) {
  const schema = new mongoose.Schema(fields, options);
  for (const index of indexes) schema.index(index);
  return mongoose.models[name] || mongoose.model(name, schema);
}

export const Supplier = model("Supplier", {
  code: { type: String, trim: true, uppercase: true, required: true, unique: true, maxlength: 50 },
  name: { type: String, trim: true, required: true, maxlength: 180 },
  ...contact,
  address: { type: String, trim: true, maxlength: 1000, default: "" },
  billingAddress: { type: String, trim: true, maxlength: 1000, default: "" },
  gstin: { type: String, trim: true, uppercase: true, maxlength: 15, default: "" },
  website: { type: String, trim: true, maxlength: 300, default: "" },
  paymentTermsDays: { type: Number, min: 0, max: 365, default: 0 },
  status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
  notes: { type: String, trim: true, maxlength: 1000, default: "" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
});

export const TransportProvider = model("TransportProvider", {
  code: { type: String, trim: true, uppercase: true, required: true, unique: true, maxlength: 50 },
  name: { type: String, trim: true, required: true, maxlength: 180 },
  type: { type: String, enum: ["COURIER", "TRANSPORTER", "THIRD_PARTY"], default: "COURIER" },
  ...contact,
  trackingUrlTemplate: { type: String, trim: true, maxlength: 500, default: "" },
  website: { type: String, trim: true, maxlength: 300, default: "" },
  status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
  notes: { type: String, trim: true, maxlength: 1000, default: "" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
});

export const Vehicle = model("Vehicle", {
  registrationNumber: { type: String, trim: true, uppercase: true, required: true, unique: true, maxlength: 30 },
  vehicleType: { type: String, enum: ["VAN", "TRUCK", "BIKE", "CAR", "OTHER"], default: "VAN" },
  capacityKg: { type: Number, min: 0, default: 0 },
  make: { type: String, trim: true, maxlength: 100, default: "" },
  model: { type: String, trim: true, maxlength: 100, default: "" },
  manufacturingYear: { type: Number, min: 1950, max: 2100, default: null },
  fuelType: { type: String, enum: ["DIESEL", "PETROL", "CNG", "ELECTRIC", "HYBRID", "OTHER", ""], default: "" },
  insuranceExpiry: { type: Date, default: null },
  permitExpiry: { type: Date, default: null },
  fitnessExpiry: { type: Date, default: null },
  lastServiceAt: { type: Date, default: null },
  nextServiceDueAt: { type: Date, default: null },
  odometerKm: { type: Number, min: 0, default: 0 },
  status: { type: String, enum: ["AVAILABLE", "IN_USE", "MAINTENANCE", "INACTIVE"], default: "AVAILABLE" },
  notes: { type: String, trim: true, maxlength: 1000, default: "" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
});

export const Driver = model("Driver", {
  name: { type: String, trim: true, required: true, maxlength: 160 },
  phone: { type: String, trim: true, required: true, maxlength: 40 },
  licenseNumber: { type: String, trim: true, uppercase: true, required: true, unique: true, maxlength: 80 },
  licenseExpiry: { type: Date, default: null },
  licenseClass: { type: String, trim: true, maxlength: 80, default: "" },
  employmentType: { type: String, enum: ["EMPLOYEE", "CONTRACTOR", "AGENCY"], default: "EMPLOYEE" },
  agencyName: { type: String, trim: true, maxlength: 180, default: "" },
  status: { type: String, enum: ["AVAILABLE", "ASSIGNED", "INACTIVE"], default: "AVAILABLE" },
  notes: { type: String, trim: true, maxlength: 1000, default: "" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
});

export const Worker = model("Worker", {
  workerCode: { type: String, trim: true, uppercase: true, required: true, unique: true, maxlength: 50 },
  name: { type: String, trim: true, required: true, maxlength: 160 },
  phone: { type: String, trim: true, maxlength: 40, default: "" },
  email: { type: String, trim: true, lowercase: true, maxlength: 254, default: "" },
  employmentType: { type: String, enum: ["EMPLOYEE", "CONTRACTOR", "AGENCY"], default: "EMPLOYEE" },
  agencyName: { type: String, trim: true, maxlength: 180, default: "" },
  jobTitle: { type: String, trim: true, maxlength: 100, default: "Warehouse Worker" },
  dailyRate: { type: Number, min: 0, default: 0 },
  shift: { type: String, enum: ["GENERAL", "MORNING", "EVENING", "NIGHT", ""], default: "" },
  contractEndAt: { type: Date, default: null },
  status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
  joinedAt: { type: Date, default: Date.now },
  notes: { type: String, trim: true, maxlength: 1000, default: "" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
});

export const Attendance = model("Attendance", {
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: "Worker", required: true, index: true },
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  status: { type: String, enum: ["PRESENT", "ABSENT", "HALF_DAY", "LEAVE"], default: "PRESENT" },
  checkIn: { type: Date, default: null },
  checkOut: { type: Date, default: null },
  hoursWorked: { type: Number, min: 0, max: 24, default: 0 },
  breakMinutes: { type: Number, min: 0, max: 1440, default: 0 },
  overtimeHours: { type: Number, min: 0, max: 24, default: 0 },
  notes: { type: String, trim: true, maxlength: 1000, default: "" },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, [{ workerId: 1, date: 1 }]);

export const WarehouseTask = model("WarehouseTask", {
  taskCode: { type: String, trim: true, uppercase: true, required: true, unique: true, maxlength: 60 },
  title: { type: String, trim: true, required: true, maxlength: 180 },
  description: { type: String, trim: true, maxlength: 2000, default: "" },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: "Worker", default: null, index: true },
  priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "URGENT"], default: "MEDIUM" },
  status: { type: String, enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"], default: "PENDING" },
  dueDate: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
});

export const BonusRecord = model("BonusRecord", {
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: "Worker", required: true, index: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  tasksCompleted: { type: Number, min: 0, default: 0 },
  attendanceDays: { type: Number, min: 0, default: 0 },
  eligible: { type: Boolean, default: false },
  amount: { type: Number, min: 0, default: 0 },
  criteria: { type: String, trim: true, maxlength: 1000, default: "" },
  approved: { type: Boolean, default: false },
  approvalStatus: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING", index: true },
  approvalNote: { type: String, trim: true, maxlength: 1000, default: "" },
  approvedAt: { type: Date, default: null },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
});

export const Shipment = model("Shipment", {
  shipmentCode: { type: String, trim: true, uppercase: true, required: true, unique: true, maxlength: 80 },
  orderReference: { type: String, trim: true, maxlength: 120, default: "" },
  customerName: { type: String, trim: true, maxlength: 180, default: "" },
  recipientPhone: { type: String, trim: true, maxlength: 40, default: "" },
  recipientEmail: { type: String, trim: true, lowercase: true, maxlength: 254, default: "" },
  originAddress: { type: String, trim: true, maxlength: 1000, default: "" },
  destinationAddress: { type: String, trim: true, maxlength: 1000, default: "" },
  packageWeightKg: { type: Number, min: 0, default: 0 },
  shippingCost: { type: Number, min: 0, default: 0 },
  expectedDeliveryAt: { type: Date, default: null },
  trackingUrl: { type: String, trim: true, maxlength: 1000, default: "" },
  trackingEvents: [{
    status: { type: String, enum: ["DRAFT", "READY", "DISPATCHED", "IN_TRANSIT", "DELIVERED", "FAILED", "RETURNED", "CANCELLED"], required: true },
    location: { type: String, trim: true, maxlength: 240, default: "" },
    notes: { type: String, trim: true, maxlength: 500, default: "" },
    occurredAt: { type: Date, default: Date.now },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  }],
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, min: 1, required: true },
  transportProviderId: { type: mongoose.Schema.Types.ObjectId, ref: "TransportProvider", default: null },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", default: null },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", default: null },
  trackingNumber: { type: String, trim: true, maxlength: 120, default: "" },
  status: { type: String, enum: ["DRAFT", "READY", "DISPATCHED", "IN_TRANSIT", "DELIVERED", "FAILED", "RETURNED", "CANCELLED"], default: "DRAFT" },
  dispatchedAt: { type: Date, default: null },
  deliveredAt: { type: Date, default: null },
  notes: { type: String, trim: true, maxlength: 1000, default: "" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
});


export const StaffingAgency = model("StaffingAgency", {
  code: { type: String, trim: true, uppercase: true, required: true, unique: true, maxlength: 50 },
  name: { type: String, trim: true, required: true, maxlength: 180 },
  ...contact,
  contractReference: { type: String, trim: true, maxlength: 120, default: "" },
  status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
  notes: { type: String, trim: true, maxlength: 1000, default: "" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
});


export const Expense = model(
  "Expense",
  {
    expenseCode: {
      type: String,
      trim: true,
      uppercase: true,
      required: true,
      unique: true,
      maxlength: 60,
    },
    category: {
      type: String,
      enum: [
        "TRANSPORT",
        "HANDLING",
        "PACKAGING",
        "REPAIR",
        "UTILITIES",
        "CONTRACT_LABOUR",
        "DAMAGE_WRITE_OFF",
        "OTHER",
      ],
      required: true,
    },
    amount: { type: Number, min: 0.01, required: true },
    expenseDate: { type: Date, required: true, index: true },
    reference: { type: String, trim: true, maxlength: 120, default: "" },
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipment",
      default: null,
    },
    supplierName: { type: String, trim: true, maxlength: 180, default: "" },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    status: {
      type: String,
      enum: ["RECORDED", "VOIDED"],
      default: "RECORDED",
      index: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  [{ expenseDate: -1, category: 1 }],
);

