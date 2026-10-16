import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { Product } from "../products/product.model.js";
import { InventoryBalance } from "../inventory/inventoryBalance.model.js";
import { StockMovement } from "../inventory/stockMovement.model.js";
import {
  Worker,
  Attendance,
  WarehouseTask,
  BonusRecord,
  Shipment,
  Expense,
} from "../operations/models.js";

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
function dateRange(query) {
  const { startDate, endDate } = query;
  const valid = (s) =>
    /^\d{4}-\d{2}-\d{2}$/.test(String(s || "")) &&
    !Number.isNaN(Date.parse(`${s}T00:00:00.000Z`));
  if ((startDate && !valid(startDate)) || (endDate && !valid(endDate)))
    throw new ApiError(400, "startDate and endDate must use YYYY-MM-DD format");
  const start = startDate ? new Date(`${startDate}T00:00:00.000Z`) : null;
  const end = endDate ? new Date(`${endDate}T23:59:59.999Z`) : null;
  if (start && end && start > end)
    throw new ApiError(400, "startDate must be on or before endDate");
  return { start, end };
}
function dateFilter(field, range) {
  const filter = {};
  if (range.start || range.end)
    filter[field] = {
      ...(range.start ? { $gte: range.start } : {}),
      ...(range.end ? { $lte: range.end } : {}),
    };
  return filter;
}

export const inventoryValuation = asyncHandler(async (_req, res) => {
  const [products, balances] = await Promise.all([
    Product.find({}).lean(),
    InventoryBalance.find({}).lean(),
  ]);
  const balanceMap = new Map(balances.map((b) => [String(b.productId), b]));
  const rows = products.map((p) => {
    const b = balanceMap.get(String(p._id)) || {
      quantityOnHand: 0,
      quantityDamaged: 0,
      quantityReserved: 0,
    };
    const available = Math.max(0, b.quantityOnHand - b.quantityReserved);
    return {
      productId: p._id,
      sku: p.sku,
      name: p.name,
      status: p.status,
      quantityOnHand: b.quantityOnHand,
      quantityDamaged: b.quantityDamaged,
      quantityReserved: b.quantityReserved,
      availableQuantity: available,
      costPrice: p.costPrice || 0,
      sellingPrice: p.sellingPrice || 0,
      stockCostValue: round2((b.quantityOnHand || 0) * (p.costPrice || 0)),
      potentialSalesValue: round2(available * (p.sellingPrice || 0)),
      estimatedPotentialGrossProfit: round2(
        available * ((p.sellingPrice || 0) - (p.costPrice || 0)),
      ),
    };
  });
  const totals = rows.reduce(
    (a, r) => ({
      productCount: a.productCount + 1,
      quantityOnHand: a.quantityOnHand + r.quantityOnHand,
      quantityDamaged: a.quantityDamaged + r.quantityDamaged,
      quantityReserved: a.quantityReserved + r.quantityReserved,
      availableQuantity: a.availableQuantity + r.availableQuantity,
      stockCostValue: round2(a.stockCostValue + r.stockCostValue),
      potentialSalesValue: round2(
        a.potentialSalesValue + r.potentialSalesValue,
      ),
      estimatedPotentialGrossProfit: round2(
        a.estimatedPotentialGrossProfit + r.estimatedPotentialGrossProfit,
      ),
    }),
    {
      productCount: 0,
      quantityOnHand: 0,
      quantityDamaged: 0,
      quantityReserved: 0,
      availableQuantity: 0,
      stockCostValue: 0,
      potentialSalesValue: 0,
      estimatedPotentialGrossProfit: 0,
    },
  );
  res.json({
    success: true,
    data: { totals, products: rows },
    note: "Estimates use current product costPrice and sellingPrice; they are not audited accounting figures.",
  });
});

export const productProfitability = asyncHandler(async (_req, res) => {
  const products = await Product.find({}).sort({ name: 1 }).lean();
  const rows = products.map((p) => {
    const cost = Number(p.costPrice || 0),
      price = Number(p.sellingPrice || 0),
      margin = price > 0 ? ((price - cost) / price) * 100 : null;
    return {
      productId: p._id,
      sku: p.sku,
      name: p.name,
      category: p.category,
      status: p.status,
      costPrice: cost,
      sellingPrice: price,
      estimatedGrossProfitPerUnit: round2(price - cost),
      estimatedGrossMarginPercent: margin === null ? null : round2(margin),
    };
  });
  res.json({
    success: true,
    data: rows,
    note: "Per-unit estimates only; this is not realized profit because sales revenue and other costs are not recorded here.",
  });
});

export const stockMovementSummary = asyncHandler(async (req, res) => {
  const range = dateRange(req.query);
  const match = dateFilter("occurredAt", range);
  const [summary, recent] = await Promise.all([
    StockMovement.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$type",
          movementCount: { $sum: 1 },
          netQuantityDelta: { $sum: "$quantityDelta" },
          acceptedQuantity: { $sum: "$acceptedQuantity" },
          damagedQuantity: { $sum: "$damagedQuantity" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    StockMovement.find(match)
      .sort({ occurredAt: -1 })
      .limit(100)
      .populate("productId", "sku name")
      .lean(),
  ]);
  res.json({
    success: true,
    data: {
      byType: summary.map((x) => ({
        type: x._id,
        movementCount: x.movementCount,
        netQuantityDelta: x.netQuantityDelta,
        acceptedQuantity: x.acceptedQuantity,
        damagedQuantity: x.damagedQuantity,
      })),
      recentMovements: recent,
    },
    meta: { recentMovementsLimit: 100 },
    note: "Recent movements are capped at 100; use the inventory movement endpoint for paginated records.",
  });
});

export const workforceCosts = asyncHandler(async (req, res) => {
  const range = dateRange(req.query);
  const filter = {};
  if (range.start || range.end) {
    // Attendance date is stored as YYYY-MM-DD text, so compare date strings inclusively.
    filter.date = {
      ...(req.query.startDate ? { $gte: req.query.startDate } : {}),
      ...(req.query.endDate ? { $lte: req.query.endDate } : {}),
    };
  }
  const [workers, attendance] = await Promise.all([
    Worker.find({}).lean(),
    Attendance.find(filter)
      .populate(
        "workerId",
        "workerCode name employmentType agencyName dailyRate",
      )
      .lean(),
  ]);
  const workerMap = new Map(workers.map((w) => [String(w._id), w]));
  const map = new Map();
  for (const a of attendance) {
    const w = a.workerId || workerMap.get(String(a.workerId));
    if (!w) continue;
    const key = String(w._id);
    const row = map.get(key) || {
      workerId: w._id,
      workerCode: w.workerCode,
      name: w.name,
      employmentType: w.employmentType,
      agencyName: w.agencyName || "",
      dailyRate: Number(w.dailyRate || 0),
      presentDays: 0,
      halfDays: 0,
      absentDays: 0,
      leaveDays: 0,
      estimatedAttendanceCost: 0,
    };
    if (a.status === "PRESENT") {
      row.presentDays++;
      row.estimatedAttendanceCost += row.dailyRate;
    } else if (a.status === "HALF_DAY") {
      row.halfDays++;
      row.estimatedAttendanceCost += row.dailyRate / 2;
    } else if (a.status === "ABSENT") row.absentDays++;
    else if (a.status === "LEAVE") row.leaveDays++;
    map.set(key, row);
  }
  const rows = [...map.values()]
    .map((r) => ({
      ...r,
      estimatedAttendanceCost: round2(r.estimatedAttendanceCost),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const totals = rows.reduce(
    (a, r) => ({
      workersWithAttendance: a.workersWithAttendance + 1,
      presentDays: a.presentDays + r.presentDays,
      halfDays: a.halfDays + r.halfDays,
      absentDays: a.absentDays + r.absentDays,
      leaveDays: a.leaveDays + r.leaveDays,
      estimatedAttendanceCost: round2(
        a.estimatedAttendanceCost + r.estimatedAttendanceCost,
      ),
    }),
    {
      workersWithAttendance: 0,
      presentDays: 0,
      halfDays: 0,
      absentDays: 0,
      leaveDays: 0,
      estimatedAttendanceCost: 0,
    },
  );
  res.json({
    success: true,
    data: { totals, workers: rows },
    note: "Estimated cost counts PRESENT as one daily rate and HALF_DAY as half a rate; confirm this matches company payroll policy.",
  });
});

export const bonusSummary = asyncHandler(async (req, res) => {
  const range = dateRange(req.query);
  const filter = {};
  if (range.start || range.end)
    filter.periodEnd = {
      ...(range.start ? { $gte: range.start } : {}),
      ...(range.end ? { $lte: range.end } : {}),
    };
  if (req.query.approved === "true") filter.approved = true;
  if (req.query.approved === "false") filter.approved = false;
  const rows = await BonusRecord.find(filter)
    .sort({ periodEnd: -1 })
    .populate("workerId", "workerCode name employmentType agencyName")
    .lean();
  const totals = rows.reduce(
    (a, r) => {
      a.records++;
      if (r.eligible) a.eligibleRecords++;
      if (r.approved) {
        a.approvedRecords++;
        a.approvedAmount = round2(a.approvedAmount + Number(r.amount || 0));
      } else {
        a.pendingApprovalRecords++;
        a.pendingAmount = round2(a.pendingAmount + Number(r.amount || 0));
      }
      return a;
    },
    {
      records: 0,
      eligibleRecords: 0,
      approvedRecords: 0,
      pendingApprovalRecords: 0,
      approvedAmount: 0,
      pendingAmount: 0,
    },
  );
  res.json({
    success: true,
    data: { totals, records: rows },
    note: "Eligibility and amounts reflect stored bonus records; the API does not automatically determine company bonus policy.",
  });
});

export const dashboardReport = asyncHandler(async (req, res) => {
  const [
    productCount,
    activeProductCount,
    balances,
    lowStock,
    movementCount,
    shipmentCounts,
    workerCount,
    attendanceCount,
    pendingTasks,
    bonusRecords,
  ] = await Promise.all([
    Product.countDocuments({}),
    Product.countDocuments({ status: "ACTIVE" }),
    InventoryBalance.find({})
      .populate("productId", "reorderLevel costPrice")
      .lean(),
    Product.aggregate([
      { $match: { status: "ACTIVE" } },
      {
        $lookup: {
          from: "inventorybalances",
          localField: "_id",
          foreignField: "productId",
          as: "balance",
        },
      },
      {
        $addFields: {
          onHand: {
            $ifNull: [{ $arrayElemAt: ["$balance.quantityOnHand", 0] }, 0],
          },
        },
      },
      { $match: { $expr: { $lte: ["$onHand", "$reorderLevel"] } } },
      { $count: "count" },
    ]),
    StockMovement.countDocuments({}),
    Shipment.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Worker.countDocuments({ status: "ACTIVE" }),
    Attendance.countDocuments({}),
    WarehouseTask.countDocuments({
      status: { $in: ["PENDING", "IN_PROGRESS"] },
    }),
    BonusRecord.countDocuments({ approved: false }),
  ]);
  const stockCostValue = round2(
    balances.reduce(
      (sum, b) =>
        sum +
        Number(b.quantityOnHand || 0) * Number(b.productId?.costPrice || 0),
      0,
    ),
  );
  res.json({
    success: true,
    data: {
      products: { total: productCount, active: activeProductCount },
      inventory: {
        productsWithBalance: balances.length,
        stockCostValueEstimate: stockCostValue,
        lowStockProductCount: lowStock[0]?.count || 0,
      },
      stockMovements: { totalRecords: movementCount },
      shipmentsByStatus: Object.fromEntries(
        shipmentCounts.map((x) => [x._id, x.count]),
      ),
      workforce: {
        activeWorkers: workerCount,
        attendanceRecords: attendanceCount,
        openTasks: pendingTasks,
      },
      bonuses: { pendingApprovalRecords: bonusRecords },
    },
    note: "Dashboard values are current snapshots except counts explicitly labelled as records.",
  });
});

export const expenseSummary = asyncHandler(async (req, res) => {
  const range = dateRange(req.query);
  const filter = { status: "RECORDED", ...dateFilter("expenseDate", range) };
  const [byCategory, recent, totalAmount] = await Promise.all([
    Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Expense.find(filter)
      .sort({ expenseDate: -1 })
      .limit(100)
      .populate("shipmentId", "shipmentCode orderReference")
      .populate("recordedBy", "name email")
      .lean(),
    Expense.aggregate([
      { $match: filter },
      {
        $group: { _id: null, amount: { $sum: "$amount" }, count: { $sum: 1 } },
      },
    ]),
  ]);
  res.json({
    success: true,
    data: {
      totals: {
        recordedExpenseCount: totalAmount[0]?.count || 0,
        totalRecordedExpenses: round2(totalAmount[0]?.amount || 0),
      },
      byCategory: byCategory.map((x) => ({
        category: x._id,
        count: x.count,
        totalAmount: round2(x.totalAmount),
      })),
      recentExpenses: recent,
    },
    note: "Recorded expenses only; not an audited profit/loss statement.",
  });
});
