import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/auth.js";
import { ROLES } from "../../constants/roles.js";
import { ApiError } from "../../utils/apiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Worker, Attendance, WarehouseTask, BonusRecord } from "../operations/models.js";
import { AuditLog } from "../audit/audit.model.js";

const router = Router();
router.use(requireAuth, requireRoles(ROLES.WORKER));

const TIME_ZONE = process.env.ATTENDANCE_TIME_ZONE || "Asia/Kolkata";
const CHECK_IN_START = process.env.ATTENDANCE_CHECK_IN_START || "08:30";
const CHECK_IN_END = process.env.ATTENDANCE_CHECK_IN_END || "10:00";
const CHECK_OUT_START = process.env.ATTENDANCE_CHECK_OUT_START || "17:30";
const CHECK_OUT_END = process.env.ATTENDANCE_CHECK_OUT_END || "20:00";

function localParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(date);
  return Object.fromEntries(parts.map(p => [p.type, p.value]));
}
function localDate(date = new Date()) {
  const p = localParts(date);
  return `${p.year}-${p.month}-${p.day}`;
}
function minutesNow(date = new Date()) {
  const p = localParts(date);
  return Number(p.hour) * 60 + Number(p.minute);
}
function toMinutes(value) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) throw new Error(`Invalid attendance window time: ${value}`);
  return Number(match[1]) * 60 + Number(match[2]);
}
function inWindow(now, start, end) {
  const current = minutesNow(now);
  return current >= toMinutes(start) && current <= toMinutes(end);
}
async function getWorker(req) {
  const worker = await Worker.findOne({ email: String(req.user.email).toLowerCase(), status: "ACTIVE" }).lean();
  if (!worker) throw new ApiError(403, "Your login is not linked to an active worker record. Contact HR to link your account.");
  const duplicate = await Worker.exists({
    email: String(req.user.email).toLowerCase(), status: "ACTIVE", _id: { $ne: worker._id }
  });
  if (duplicate) throw new ApiError(409, "Your account matches multiple worker records. Contact HR.");
  return worker;
}
function workerSafe(worker) {
  return {
    id: String(worker._id), workerCode: worker.workerCode, name: worker.name,
    email: worker.email, jobTitle: worker.jobTitle, employmentType: worker.employmentType,
    agencyName: worker.agencyName, status: worker.status
  };
}
async function currentAttendance(workerId, date = localDate()) {
  return Attendance.findOne({ workerId, date }).lean();
}
function attendanceState(record) {
  if (!record?.checkIn) return "NOT_CHECKED_IN";
  if (!record.checkOut) return "CHECKED_IN";
  return "CHECKED_OUT";
}
function publicAttendance(record) {
  if (!record) return null;
  return {
    id: String(record._id), date: record.date, status: record.status,
    checkIn: record.checkIn, checkOut: record.checkOut,
    hoursWorked: record.hoursWorked, notes: record.notes || ""
  };
}
router.get("/me", asyncHandler(async (req, res) => {
  const worker = await getWorker(req);
  const today = localDate();
  const [attendance, tasks, bonuses, history] = await Promise.all([
    currentAttendance(worker._id, today),
    WarehouseTask.find({ workerId: worker._id }).sort({ dueDate: 1, createdAt: -1 }).limit(50).lean(),
    BonusRecord.find({ workerId: worker._id }).sort({ periodEnd: -1, createdAt: -1 }).limit(30).lean(),
    Attendance.find({ workerId: worker._id }).sort({ date: -1 }).limit(30).lean()
  ]);
  res.json({ success: true, data: {
    worker: workerSafe(worker),
    attendance: publicAttendance(attendance),
    attendanceState: attendanceState(attendance),
    attendanceWindow: {
      timeZone: TIME_ZONE, checkInStart: CHECK_IN_START, checkInEnd: CHECK_IN_END,
      checkOutStart: CHECK_OUT_START, checkOutEnd: CHECK_OUT_END
    },
    canCheckIn: !attendance?.checkIn && inWindow(new Date(), CHECK_IN_START, CHECK_IN_END),
    canCheckOut: Boolean(attendance?.checkIn && !attendance?.checkOut) && inWindow(new Date(), CHECK_OUT_START, CHECK_OUT_END),
    tasks: tasks.map(t => ({
      id: String(t._id), taskCode: t.taskCode, title: t.title, description: t.description,
      priority: t.priority, status: t.status, dueDate: t.dueDate, completedAt: t.completedAt
    })),
    bonuses: bonuses.map(b => ({
      id: String(b._id), periodStart: b.periodStart, periodEnd: b.periodEnd,
      tasksCompleted: b.tasksCompleted, attendanceDays: b.attendanceDays,
      eligible: b.eligible, amount: b.amount, criteria: b.criteria,
      approvalStatus: b.approvalStatus, approvalNote: b.approvalNote
    })),
    attendanceHistory: history.map(publicAttendance)
  }});
}));
router.post("/attendance/check-in", asyncHandler(async (req, res) => {
  const worker = await getWorker(req);
  const now = new Date();
  if (!inWindow(now, CHECK_IN_START, CHECK_IN_END)) {
    throw new ApiError(403, `Check-in is available from ${CHECK_IN_START} to ${CHECK_IN_END} (${TIME_ZONE}). Contact your manager if you need an exception.`);
  }
  const date = localDate(now);
  let record;
  try {
    record = await Attendance.findOneAndUpdate(
      { workerId: worker._id, date, checkIn: null },
      { $set: { checkIn: now, checkOut: null, status: "PRESENT", hoursWorked: 0, recordedBy: req.user._id } },
      { new: true, runValidators: true }
    );
    if (!record) {
      record = await Attendance.create({
        workerId: worker._id, date, status: "PRESENT", checkIn: now,
        checkOut: null, hoursWorked: 0, recordedBy: req.user._id
      });
    }
  } catch (error) {
    if (error?.code === 11000) throw new ApiError(409, "Attendance is already recorded for today.");
    throw error;
  }
  await AuditLog.create({
    actorId: req.user._id, action: "WORKER_CHECK_IN", entityType: "Attendance",
    entityId: record._id, summary: `Worker ${worker.workerCode} checked in`, metadata: { date, timeZone: TIME_ZONE }
  });
  res.status(201).json({ success: true, data: { attendance: publicAttendance(record), attendanceState: attendanceState(record) } });
}));
router.post("/attendance/check-out", asyncHandler(async (req, res) => {
  const worker = await getWorker(req);
  const now = new Date();
  if (!inWindow(now, CHECK_OUT_START, CHECK_OUT_END)) {
    throw new ApiError(403, `Check-out is available from ${CHECK_OUT_START} to ${CHECK_OUT_END} (${TIME_ZONE}). Contact your manager if you need an exception.`);
  }
  const date = localDate(now);
  const record = await Attendance.findOne({ workerId: worker._id, date });
  if (!record?.checkIn) throw new ApiError(409, "Check in before checking out.");
  if (record.checkOut) throw new ApiError(409, "You have already checked out for today.");
  if (now <= new Date(record.checkIn)) throw new ApiError(409, "Check-out must be after check-in.");
  record.checkOut = now;
  record.hoursWorked = Math.round(((now - new Date(record.checkIn)) / 3600000) * 100) / 100;
  record.status = record.hoursWorked < 4 ? "HALF_DAY" : "PRESENT";
  record.recordedBy = req.user._id;
  await record.save();
  await AuditLog.create({
    actorId: req.user._id, action: "WORKER_CHECK_OUT", entityType: "Attendance",
    entityId: record._id, summary: `Worker ${worker.workerCode} checked out`, metadata: { date, hoursWorked: record.hoursWorked, timeZone: TIME_ZONE }
  });
  res.json({ success: true, data: { attendance: publicAttendance(record), attendanceState: attendanceState(record) } });
}));
router.patch("/tasks/:id/status", asyncHandler(async (req, res) => {
  const worker = await getWorker(req);
  const { status } = req.body || {};
  if (!["IN_PROGRESS", "COMPLETED"].includes(status)) throw new ApiError(400, "Worker task status must be IN_PROGRESS or COMPLETED.");
  const task = await WarehouseTask.findOne({ _id: req.params.id, workerId: worker._id });
  if (!task) throw new ApiError(404, "Assigned task not found.");
  const transitions = { PENDING: ["IN_PROGRESS"], IN_PROGRESS: ["COMPLETED"], COMPLETED: [], CANCELLED: [] };
  if (!transitions[task.status]?.includes(status)) throw new ApiError(409, `Cannot change task from ${task.status} to ${status}.`);
  task.status = status;
  task.completedAt = status === "COMPLETED" ? new Date() : null;
  await task.save();
  await AuditLog.create({
    actorId: req.user._id, action: "WORKER_TASK_STATUS_CHANGED", entityType: "WarehouseTask",
    entityId: task._id, summary: `Worker ${worker.workerCode} changed task ${task.taskCode} to ${status}`
  });
  res.json({ success: true, data: { id: String(task._id), taskCode: task.taskCode, title: task.title, status: task.status, completedAt: task.completedAt } });
}));
export default router;
