import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/db.js";
import { env } from "../config/env.js";
import { ROLES } from "../constants/roles.js";
import { User } from "../modules/users/user.model.js";
import { Product } from "../modules/products/product.model.js";
import { InventoryBalance } from "../modules/inventory/inventoryBalance.model.js";
import { StockMovement } from "../modules/inventory/stockMovement.model.js";
import { AuditLog } from "../modules/audit/audit.model.js";
import {
  Supplier, TransportProvider, Vehicle, Driver, Worker, Attendance,
  WarehouseTask, BonusRecord, Shipment, StaffingAgency, Expense
} from "../modules/operations/models.js";

const PREFIX = "DEMO-V2";
const password = process.env.SEED_DEMO_PASSWORD;
const enabled = process.env.SEED_DEMO === "true";
const dbName = new URL(env.MONGODB_URI).pathname.replace(/^\//, "").split("?")[0];

if (!enabled) throw new Error("Demo seed is disabled. Set SEED_DEMO=true only in a dedicated test/demo environment.");
if (env.NODE_ENV === "production") throw new Error("Refusing to seed when NODE_ENV=production.");
if (!/(demo|test|testing|seed)/i.test(dbName)) {
  throw new Error(`Refusing to seed database "${dbName}". Use a separate database whose name includes demo or test.`);
}
if (!password || password.length < 12) throw new Error("Set SEED_DEMO_PASSWORD to a unique password of at least 12 characters.");

const counts = {};
async function upsert(Model, key, keyValue, fields) {
  const doc = await Model.findOneAndUpdate(
    { [key]: keyValue },
    { $setOnInsert: fields },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  counts[Model.modelName] = (counts[Model.modelName] || 0) + 1;
  return doc;
}
const daysAgo = n => new Date(Date.now() - n * 86400000);
const isoDay = n => daysAgo(n).toISOString().slice(0, 10);

async function run() {
  await connectDB();
  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

  // Demo users: stable emails; existing accounts are reused without changing passwords/roles.
  const users = {};
  const userSeeds = [
    ["admin", "Demo Admin", ROLES.ADMIN],
    ["inventory", "Demo Inventory Manager", ROLES.INVENTORY_MANAGER],
    ["receiving", "Demo Receiving Staff", ROLES.RECEIVING_STAFF],
    ["dispatch", "Demo Dispatch Staff", ROLES.DISPATCH_STAFF],
    ["transport", "Demo Transport Coordinator", ROLES.TRANSPORT_COORDINATOR],
    ["hr", "Demo HR Manager", ROLES.HR_MANAGER],
    ["finance", "Demo Finance Viewer", ROLES.FINANCE_VIEWER],
    ["worker", "Demo Worker", ROLES.WORKER],
  ];
  for (const [key, name, role] of userSeeds) {
    const email = `demo.${key}@fixl.test`;
    let user = await User.findOne({ email });
    if (!user) user = await User.create({ name, email, passwordHash, role, status: "ACTIVE" });
    users[key] = user;
    const profileByRole = {
      admin: { employeeCode: "DEMO-EMP-001", phone: "9000000101", department: "Operations", jobTitle: "Warehouse Administrator", joinedAt: daysAgo(365) },
      inventory: { employeeCode: "DEMO-EMP-002", phone: "9000000102", department: "Warehouse", jobTitle: "Inventory Manager", joinedAt: daysAgo(300) },
      receiving: { employeeCode: "DEMO-EMP-003", phone: "9000000103", department: "Warehouse", jobTitle: "Receiving Associate", joinedAt: daysAgo(240) },
      dispatch: { employeeCode: "DEMO-EMP-004", phone: "9000000104", department: "Dispatch", jobTitle: "Dispatch Associate", joinedAt: daysAgo(220) },
      transport: { employeeCode: "DEMO-EMP-005", phone: "9000000105", department: "Transport", jobTitle: "Transport Coordinator", joinedAt: daysAgo(180) },
      hr: { employeeCode: "DEMO-EMP-006", phone: "9000000106", department: "Human Resources", jobTitle: "HR Manager", joinedAt: daysAgo(400) },
      finance: { employeeCode: "DEMO-EMP-007", phone: "9000000107", department: "Finance", jobTitle: "Finance Analyst", joinedAt: daysAgo(350) },
      worker: { employeeCode: "DEMO-EMP-008", phone: "9000000108", department: "Warehouse", jobTitle: "Warehouse Associate", joinedAt: daysAgo(90) }
    };
    await User.updateOne({ email }, { $set: profileByRole[key] });
  }
  const admin = users.admin;
  const inventoryUser = users.inventory;
  const hrUser = users.hr;
  const financeUser = users.finance;

  const products = [];
  const productSeeds = [
    { sku: "DEMO-BOX-S", name: "Small Shipping Box", category: "Packaging", unitOfMeasure: "piece", costPrice: 12, sellingPrice: 20, reorderLevel: 30, quantity: 120, damaged: 4, brand: "Fixl Pack", modelNumber: "BOX-S-01", barcode: "8900000001001", storageLocation: "A-01-02", weightKg: 0.18, lengthCm: 20, widthCm: 15, heightCm: 10, taxRatePercent: 18, minimumOrderQuantity: 50, warrantyMonths: 0 },
    { sku: "DEMO-BOX-L", name: "Large Shipping Box", category: "Packaging", unitOfMeasure: "piece", costPrice: 22, sellingPrice: 35, reorderLevel: 20, quantity: 64, damaged: 2, brand: "Fixl Pack", modelNumber: "BOX-L-01", barcode: "8900000001002", storageLocation: "A-01-03", weightKg: 0.32, lengthCm: 40, widthCm: 30, heightCm: 25, taxRatePercent: 18, minimumOrderQuantity: 25, warrantyMonths: 0 },
    { sku: "DEMO-TAPE", name: "Packing Tape Roll", category: "Packaging", unitOfMeasure: "roll", costPrice: 28, sellingPrice: 42, reorderLevel: 25, quantity: 18, damaged: 1, brand: "SecureSeal", modelNumber: "TAPE-48", barcode: "8900000001003", storageLocation: "A-02-01", weightKg: 0.25, lengthCm: 10, widthCm: 10, heightCm: 5, taxRatePercent: 18, minimumOrderQuantity: 20, warrantyMonths: 0 },
    { sku: "DEMO-LABEL", name: "Shipping Label Pack", category: "Consumables", unitOfMeasure: "pack", costPrice: 45, sellingPrice: 70, reorderLevel: 10, quantity: 45, damaged: 0, brand: "LabelPro", modelNumber: "LBL-A6-100", barcode: "8900000001004", storageLocation: "B-01-01", weightKg: 0.4, lengthCm: 21, widthCm: 15, heightCm: 3, taxRatePercent: 18, minimumOrderQuantity: 10, warrantyMonths: 0 },
    { sku: "DEMO-SCANNER", name: "Barcode Scanner", category: "Equipment", unitOfMeasure: "piece", costPrice: 1800, sellingPrice: 2300, reorderLevel: 3, quantity: 8, damaged: 0, brand: "ScanPoint", modelNumber: "SP-220", barcode: "8900000001005", storageLocation: "E-01-01", weightKg: 0.35, lengthCm: 18, widthCm: 8, heightCm: 6, taxRatePercent: 18, minimumOrderQuantity: 1, warrantyMonths: 12 }
  ];
  for (const p of productSeeds) {
    const product = await upsert(Product, "sku", p.sku, {
      sku: p.sku, name: p.name, category: p.category, unitOfMeasure: p.unitOfMeasure,
      costPrice: p.costPrice, sellingPrice: p.sellingPrice, reorderLevel: p.reorderLevel,
      status: "ACTIVE", description: "Seeded demo record", brand: p.brand, modelNumber: p.modelNumber,
      barcode: p.barcode, storageLocation: p.storageLocation, weightKg: p.weightKg,
      lengthCm: p.lengthCm, widthCm: p.widthCm, heightCm: p.heightCm,
      taxRatePercent: p.taxRatePercent, minimumOrderQuantity: p.minimumOrderQuantity,
      warrantyMonths: p.warrantyMonths, createdBy: admin._id, updatedBy: admin._id
    });
    // These SKUs are reserved for isolated demo data; backfill newly introduced demo fields safely.
    await Product.updateOne({ sku: p.sku }, { $set: {
      brand: p.brand, modelNumber: p.modelNumber, barcode: p.barcode, storageLocation: p.storageLocation,
      weightKg: p.weightKg, lengthCm: p.lengthCm, widthCm: p.widthCm, heightCm: p.heightCm,
      taxRatePercent: p.taxRatePercent, minimumOrderQuantity: p.minimumOrderQuantity, warrantyMonths: p.warrantyMonths
    }});
    products.push({ ...p, doc: product });
  }

  // Seed inventory is established only on first creation. A rerun will never overwrite live balances.
  for (const p of products) {
    const exists = await InventoryBalance.findOne({ productId: p.doc._id });
    if (!exists) {
      const balance = await InventoryBalance.create({
        productId: p.doc._id, quantityOnHand: p.quantity, quantityDamaged: p.damaged,
        quantityReserved: 0, updatedBy: inventoryUser._id
      });
      await StockMovement.create({
        productId: p.doc._id, type: "RECEIPT", quantityDelta: p.quantity, acceptedQuantity: p.quantity,
        damagedQuantity: p.damaged, reference: `${PREFIX}-OPENING-${p.sku}`,
        reason: "Demo opening stock", performedBy: inventoryUser._id,
        balanceAfter: balance.quantityOnHand, damagedBalanceAfter: balance.quantityDamaged
      });
      await AuditLog.create({
        actorId: inventoryUser._id, action: "DEMO_OPENING_STOCK", entityType: "InventoryBalance",
        entityId: balance._id, summary: `Seeded demo opening balance for ${p.sku}`,
        metadata: { seed: PREFIX, productId: p.doc._id }
      });
    }
  }

  const supplier = await upsert(Supplier, "code", "DEMO-SUP-01", {
    code: "DEMO-SUP-01", name: "Demo Packaging Supplier", contactName: "Demo Contact",
    phone: "9000000001", email: "supplier@fixl.test", address: "Unit 12, Packaging Industrial Estate, Jaipur, Rajasthan 302013",
    billingAddress: "Accounts Office, Unit 12, Packaging Industrial Estate, Jaipur, Rajasthan 302013",
    gstin: "08DEMOX1234A1Z5", website: "https://supplier.example.test", paymentTermsDays: 30,
    status: "ACTIVE", notes: "Demo supplier profile; not a real business", createdBy: admin._id
  });
  await Supplier.updateOne({ code: "DEMO-SUP-01" }, { $set: {
    address: "Unit 12, Packaging Industrial Estate, Jaipur, Rajasthan 302013",
    billingAddress: "Accounts Office, Unit 12, Packaging Industrial Estate, Jaipur, Rajasthan 302013",
    gstin: "08DEMOX1234A1Z5", website: "https://supplier.example.test", paymentTermsDays: 30
  }});
  const provider = await upsert(TransportProvider, "code", "DEMO-COURIER-01", {
    code: "DEMO-COURIER-01", name: "Demo Express Courier", type: "COURIER",
    contactName: "Demo Operations", phone: "9000000002", email: "courier@fixl.test",
    trackingUrlTemplate: "https://tracking.example.test/track/{trackingNumber}",
    website: "https://courier.example.test", status: "ACTIVE",
    notes: "Synthetic demo carrier. Tracking links are placeholders and do not resolve to a real shipment.", createdBy: admin._id
  });
  await TransportProvider.updateOne({ code: "DEMO-COURIER-01" }, { $set: {
    trackingUrlTemplate: "https://tracking.example.test/track/{trackingNumber}",
    website: "https://courier.example.test",
    notes: "Synthetic demo carrier. Tracking links are placeholders and do not resolve to a real shipment."
  }});
  const vehicle = await upsert(Vehicle, "registrationNumber", "DEMO-VAN-001", {
    registrationNumber: "DEMO-VAN-001", vehicleType: "VAN", capacityKg: 800,
    make: "Tata", model: "Ace Demo", manufacturingYear: 2023, fuelType: "DIESEL",
    insuranceExpiry: daysAgo(-180), permitExpiry: daysAgo(-150), fitnessExpiry: daysAgo(-120),
    lastServiceAt: daysAgo(30), nextServiceDueAt: daysAgo(-60), odometerKm: 18450,
    status: "AVAILABLE", notes: "Synthetic demo vehicle; registration and compliance dates are not real.", createdBy: admin._id
  });
  await Vehicle.updateOne({ registrationNumber: "DEMO-VAN-001" }, { $set: {
    make: "Tata", model: "Ace Demo", manufacturingYear: 2023, fuelType: "DIESEL",
    insuranceExpiry: daysAgo(-180), permitExpiry: daysAgo(-150), fitnessExpiry: daysAgo(-120),
    lastServiceAt: daysAgo(30), nextServiceDueAt: daysAgo(-60), odometerKm: 18450
  }});
  const driver = await upsert(Driver, "licenseNumber", "DEMO-LIC-001", {
    name: "Demo Driver", phone: "9000000003", licenseNumber: "DEMO-LIC-001",
    licenseExpiry: daysAgo(-500), licenseClass: "LMV-TR", employmentType: "EMPLOYEE", agencyName: "",
    status: "AVAILABLE", notes: "Synthetic demo driver; license details are placeholders.", createdBy: admin._id
  });
  await Driver.updateOne({ licenseNumber: "DEMO-LIC-001" }, { $set: {
    licenseExpiry: daysAgo(-500), licenseClass: "LMV-TR", employmentType: "EMPLOYEE", agencyName: ""
  }});
  const agency = await upsert(StaffingAgency, "code", "DEMO-AGENCY-01", {
    code: "DEMO-AGENCY-01", name: "Demo Staffing Agency", contactName: "Demo Coordinator",
    phone: "9000000004", email: "agency@fixl.test", contractReference: "DEMO-CONTRACT-01",
    status: "ACTIVE", notes: "Seed data only", createdBy: admin._id
  });

  const workers = [];
  const workerSeeds = [
    { workerCode: "DEMO-WRK-001", name: "Demo Worker One", employmentType: "EMPLOYEE", agencyName: "", dailyRate: 850, shift: "MORNING", contractEndAt: null },
    { workerCode: "DEMO-WRK-002", name: "Demo Worker Two", employmentType: "CONTRACTOR", agencyName: "", dailyRate: 950, shift: "EVENING", contractEndAt: daysAgo(-180) },
    { workerCode: "DEMO-WRK-003", name: "Demo Agency Worker", employmentType: "AGENCY", agencyName: agency.name, dailyRate: 800, shift: "NIGHT", contractEndAt: daysAgo(-90) }
  ];
  for (const w of workerSeeds) {
    workers.push(await upsert(Worker, "workerCode", w.workerCode, {
      ...w, phone: "9000000010", email: w.workerCode === "DEMO-WRK-001" ? users.worker.email : `${w.workerCode.toLowerCase()}@fixl.test`,
      jobTitle: "Warehouse Associate", shift: w.shift, contractEndAt: w.contractEndAt,
      status: "ACTIVE", joinedAt: daysAgo(90),
      notes: "Synthetic demo workforce record", createdBy: hrUser._id
    }));
    await Worker.updateOne({ workerCode: w.workerCode }, { $set: { shift: w.shift, contractEndAt: w.contractEndAt } });
  }

  // In the isolated demo seed, link the demo login to exactly one workforce record.
  await Worker.updateOne({ _id: workers[0]._id }, { $set: { email: users.worker.email } });

  for (let i = 0; i < workers.length; i++) {
    await upsert(Attendance, "_id", new mongoose.Types.ObjectId(`6a100000000000000000000${i + 1}`), {
      workerId: workers[i]._id, date: isoDay(i + 1), status: i === 1 ? "HALF_DAY" : "PRESENT",
      checkIn: new Date(`${isoDay(i + 1)}T09:00:00.000Z`),
      checkOut: new Date(`${isoDay(i + 1)}T17:00:00.000Z`), hoursWorked: i === 1 ? 4 : 8,
      breakMinutes: i === 1 ? 30 : 45, overtimeHours: i === 2 ? 1 : 0,
      notes: "Synthetic demo attendance", recordedBy: hrUser._id
    });
    await Attendance.updateOne(
      { _id: new mongoose.Types.ObjectId(`6a100000000000000000000${i + 1}`) },
      { $set: { breakMinutes: i === 1 ? 30 : 45, overtimeHours: i === 2 ? 1 : 0 } }
    );
  }

  const taskSeeds = [
    { taskCode: "DEMO-TASK-001", title: "Receive packaging shipment", status: "COMPLETED", priority: "HIGH", workerId: workers[0]._id, dueDate: daysAgo(2), completedAt: daysAgo(2) },
    { taskCode: "DEMO-TASK-002", title: "Count packing tape stock", status: "IN_PROGRESS", priority: "MEDIUM", workerId: workers[1]._id, dueDate: daysAgo(-1), completedAt: null },
    { taskCode: "DEMO-TASK-003", title: "Prepare dispatch staging area", status: "PENDING", priority: "URGENT", workerId: workers[2]._id, dueDate: daysAgo(-2), completedAt: null }
  ];
  for (const t of taskSeeds) {
    await upsert(WarehouseTask, "taskCode", t.taskCode, {
      ...t, description: "Seeded demo task", createdBy: hrUser._id
    });
  }

  const shipment = await upsert(Shipment, "shipmentCode", "DEMO-SHIP-001", {
    shipmentCode: "DEMO-SHIP-001", orderReference: "DEMO-ORDER-001",
    customerName: "Demo Customer", recipientPhone: "9000000201", recipientEmail: "recipient@fixl.test",
    originAddress: "FIXL Demo Warehouse, Jaipur, Rajasthan 302013",
    destinationAddress: "Demo Delivery Address, Jaipur, Rajasthan 302018",
    packageWeightKg: 1.2, shippingCost: 145, expectedDeliveryAt: daysAgo(-2),
    productId: products[0].doc._id, quantity: 5, transportProviderId: provider._id,
    vehicleId: vehicle._id, driverId: driver._id, trackingNumber: "DEMO-TRACK-001",
    trackingUrl: "https://tracking.example.test/track/DEMO-TRACK-001",
    status: "DRAFT", notes: "Synthetic demo shipment; not dispatched and does not change stock.",
    createdBy: admin._id, updatedBy: admin._id
  });
  await Shipment.updateOne({ shipmentCode: "DEMO-SHIP-001" }, { $set: {
    recipientPhone: "9000000201", recipientEmail: "recipient@fixl.test",
    originAddress: "FIXL Demo Warehouse, Jaipur, Rajasthan 302013",
    destinationAddress: "Demo Delivery Address, Jaipur, Rajasthan 302018",
    packageWeightKg: 1.2, shippingCost: 145, expectedDeliveryAt: daysAgo(-2),
    trackingUrl: "https://tracking.example.test/track/DEMO-TRACK-001"
  }});
  await Shipment.updateOne(
    { shipmentCode: "DEMO-SHIP-001", $or: [{ trackingEvents: { $exists: false } }, { trackingEvents: { $size: 0 } }] },
    { $set: { trackingEvents: [{ status: "DRAFT", location: "FIXL Demo Warehouse", notes: "Shipment created for demo testing", occurredAt: new Date(), recordedBy: admin._id }] } }
  );

  await upsert(BonusRecord, "_id", new mongoose.Types.ObjectId("6a2000000000000000000001"), {
    workerId: workers[0]._id, periodStart: daysAgo(30), periodEnd: daysAgo(1),
    tasksCompleted: 4, attendanceDays: 20, eligible: true, amount: 500,
    criteria: "Demo policy example only; confirm real policy before use",
    approved: false, approvalStatus: "PENDING", createdBy: hrUser._id
  });
  await upsert(BonusRecord, "_id", new mongoose.Types.ObjectId("6a2000000000000000000002"), {
    workerId: workers[1]._id, periodStart: daysAgo(30), periodEnd: daysAgo(1),
    tasksCompleted: 1, attendanceDays: 12, eligible: false, amount: 0,
    criteria: "Demo ineligible example", approved: false, approvalStatus: "PENDING", createdBy: hrUser._id
  });

  const expenseSeeds = [
    { expenseCode: "DEMO-EXP-001", category: "TRANSPORT", amount: 1250, days: 2, reference: "DEMO-TRIP-01", supplierName: provider.name, description: "Demo local transport charge" },
    { expenseCode: "DEMO-EXP-002", category: "PACKAGING", amount: 640, days: 4, reference: "DEMO-PACK-01", supplierName: supplier.name, description: "Demo packaging materials" },
    { expenseCode: "DEMO-EXP-003", category: "CONTRACT_LABOUR", amount: 1600, days: 1, reference: "DEMO-LABOUR-01", supplierName: agency.name, description: "Demo contract labour charge" }
  ];
  for (const e of expenseSeeds) {
    await upsert(Expense, "expenseCode", e.expenseCode, {
      expenseCode: e.expenseCode, category: e.category, amount: e.amount,
      expenseDate: daysAgo(e.days), reference: e.reference, shipmentId: null,
      supplierName: e.supplierName, description: e.description, status: "RECORDED",
      recordedBy: financeUser._id
    });
  }

  await AuditLog.updateOne(
    { action: "DEMO_SEED_COMPLETED", entityType: "DemoSeed", summary: PREFIX },
    { $setOnInsert: { actorId: admin._id, action: "DEMO_SEED_COMPLETED", entityType: "DemoSeed", entityId: admin._id, summary: PREFIX, metadata: { productCount: products.length, workerCount: workers.length, seedVersion: PREFIX } } },
    { upsert: true }
  );

  console.log("\nFixl demo seed completed.");
  console.log("Demo users (use the SEED_DEMO_PASSWORD you configured):");
  for (const [key, user] of Object.entries(users)) console.log(`  ${key.padEnd(10)} ${user.email} | ${user.role}`);
  console.log("\nSeed data summary:");
  console.log(`  Products: ${products.length}`);
  console.log(`  Supplier/provider/vehicle/driver/agency: 1 each`);
  console.log(`  Workers: ${workers.length}`);
  console.log(`  Attendance records: ${workers.length} (existing records are reused)`);
  console.log(`  Tasks: ${taskSeeds.length}`);
  console.log(`  Shipments: 1 DRAFT (no stock deducted)`);
  console.log(`  Bonus records: 2`);
  console.log(`  Expenses: ${expenseSeeds.length}`);
  console.log("\nRe-running is designed to reuse stable demo records. Inventory balances are only initialized when missing.");
  console.log("Do not use these records as real operational data.");
}

run()
  .catch(err => {
    console.error("Demo seed failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB().catch(() => {});
  });
