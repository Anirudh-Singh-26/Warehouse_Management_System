import mongoose from "mongoose";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/apiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AuditLog } from "../audit/audit.model.js";
import { User } from "../users/user.model.js";
import { Worker, Attendance, WarehouseTask, BonusRecord } from "./models.js";

function localParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: env.ATTENDANCE_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(date);
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) };
}
function inWindow(nowMinutes, start, end) {
  const toMinutes = value => { const [h, m] = value.split(":").map(Number); return h * 60 + m; };
  return nowMinutes >= toMinutes(start) && nowMinutes <= toMinutes(end);
}
async function getLinkedWorker(user) {
  const email = String(user.email || "").trim().toLowerCase();
  if (!email) throw new ApiError(403, "Your login is not linked to a workforce record. Contact your manager.");
  const matches = await Worker.find({ email, status: "ACTIVE" }).limit(2);
  if (matches.length !== 1) {
    throw new ApiError(403, matches.length ? "More than one active workforce record uses your login email. Contact your manager." : "Your login is not linked to an active workforce record. Ask your manager to set the same email on your worker profile.");
  }
  return matches[0];
}
function publicAttendance(record) {
  if (!record) return null;
  return { id: record._id, date: record.date, status: record.status, checkIn: record.checkIn, checkOut: record.checkOut, hoursWorked: record.hoursWorked };
}
async function audit(user, action, entityId, summary, metadata = {}) {
  await AuditLog.create({ actorId: user._id, action, entityType: "Attendance", entityId, summary, metadata });
}

export const workerPortal = asyncHandler(async (req, res) => {
  const worker = await getLinkedWorker(req.user);
  const { date } = localParts();
  const [today, attendance, tasks, bonuses] = await Promise.all([
    Attendance.findOne({ workerId: worker._id, date }),
    Attendance.find({ workerId: worker._id }).sort({ date: -1 }).limit(30).lean(),
    WarehouseTask.find({ workerId: worker._id, status: { $in: ["PENDING", "IN_PROGRESS", "COMPLETED"] } }).sort({ dueDate: 1, createdAt: -1 }).limit(100).lean(),
    BonusRecord.find({ workerId: worker._id }).select("periodStart periodEnd tasksCompleted attendanceDays eligible amount approvalStatus approvalNote approvedAt createdAt").sort({ periodEnd: -1 }).limit(50).lean()
  ]);
  const now = localParts();
  res.json({ success: true, data: {
    worker: { id: worker._id, workerCode: worker.workerCode, name: worker.name, email: worker.email, jobTitle: worker.jobTitle, employmentType: worker.employmentType },
    today: { date, attendance: publicAttendance(today), canCheckIn: !today?.checkIn && inWindow(now.minutes, env.ATTENDANCE_CHECKIN_START, env.ATTENDANCE_CHECKIN_END), canCheckOut: Boolean(today?.checkIn && !today?.checkOut && inWindow(now.minutes, env.ATTENDANCE_CHECKOUT_START, env.ATTENDANCE_CHECKOUT_END)), windows: { checkInStart: env.ATTENDANCE_CHECKIN_START, checkInEnd: env.ATTENDANCE_CHECKIN_END, checkOutStart: env.ATTENDANCE_CHECKOUT_START, checkOutEnd: env.ATTENDANCE_CHECKOUT_END, timeZone: env.ATTENDANCE_TIME_ZONE } },
    attendance: attendance.map(publicAttendance), tasks, bonuses
  }});
});

export const checkIn = asyncHandler(async (req, res) => {
  const worker = await getLinkedWorker(req.user);
  const now = new Date();
  const local = localParts(now);
  if (!inWindow(local.minutes, env.ATTENDANCE_CHECKIN_START, env.ATTENDANCE_CHECKIN_END)) {
    throw new ApiError(403, `Check-in is available between ${env.ATTENDANCE_CHECKIN_START} and ${env.ATTENDANCE_CHECKIN_END} (${env.ATTENDANCE_TIME_ZONE}).`);
  }
  const existing = await Attendance.findOne({ workerId: worker._id, date: local.date });
  if (existing?.checkIn) throw new ApiError(409, "You have already checked in for today.");
  let record;
  try {
    record = await Attendance.findOneAndUpdate(
      { workerId: worker._id, date: local.date, checkIn: null },
      { $set: { checkIn: now, status: "PRESENT", recordedBy: req.user._id } },
      { new: true }
    );
    if (!record) {
      record = await Attendance.create({ workerId: worker._id, date: local.date, status: "PRESENT", checkIn: now, checkOut: null, hoursWorked: 0, recordedBy: req.user._id, notes: "Worker self-service check-in" });
    }
  } catch (err) {
    if (err?.code === 11000) throw new ApiError(409, "Attendance already exists for today. Refresh the page.");
    throw err;
  }
  await audit(req.user, "WORKER_CHECK_IN", record._id, `Worker ${worker.workerCode} checked in`, { workerId: String(worker._id), date: local.date, checkIn: now.toISOString() });
  res.status(200).json({ success: true, data: { attendance: publicAttendance(record), message: "Check-in recorded using the server time." } });
});

export const checkOut = asyncHandler(async (req, res) => {
  const worker = await getLinkedWorker(req.user);
  const now = new Date();
  const local = localParts(now);
  if (!inWindow(local.minutes, env.ATTENDANCE_CHECKOUT_START, env.ATTENDANCE_CHECKOUT_END)) {
    throw new ApiError(403, `Check-out is available between ${env.ATTENDANCE_CHECKOUT_START} and ${env.ATTENDANCE_CHECKOUT_END} (${env.ATTENDANCE_TIME_ZONE}).`);
  }
  const record = await Attendance.findOne({ workerId: worker._id, date: local.date });
  if (!record?.checkIn) throw new ApiError(409, "You must check in before checking out.");
  if (record.checkOut) throw new ApiError(409, "You have already checked out for today.");
  if (now <= record.checkIn) throw new ApiError(409, "Check-out time must be after check-in time.");
  const updated = await Attendance.findOneAndUpdate(
    { _id: record._id, checkOut: null },
    { $set: { checkOut: now, hoursWorked: Math.round(((now - record.checkIn) / 3600000) * 100) / 100 } },
    { new: true }
  );
  if (!updated) throw new ApiError(409, "Attendance was updated by another request. Refresh and try again.");
  await audit(req.user, "WORKER_CHECK_OUT", updated._id, `Worker ${worker.workerCode} checked out`, { workerId: String(worker._id), date: local.date, checkOut: now.toISOString(), hoursWorked: updated.hoursWorked });
  res.json({ success: true, data: { attendance: publicAttendance(updated), message: "Check-out recorded using the server time." } });
});

export const updateMyTaskStatus = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, "Invalid task ID");
  const worker = await getLinkedWorker(req.user);
  const next = req.body?.status;
  if (!["IN_PROGRESS", "COMPLETED"].includes(next)) throw new ApiError(400, "Workers can set tasks to In Progress or Completed.");
  const task = await WarehouseTask.findOne({ _id: req.params.id, workerId: worker._id });
  if (!task) throw new ApiError(404, "Assigned task not found");
  const allowed = task.status === "PENDING" && next === "IN_PROGRESS" || task.status === "IN_PROGRESS" && next === "COMPLETED";
  if (!allowed) throw new ApiError(409, `Cannot change task from ${task.status} to ${next}.`);
  task.status = next;
  task.completedAt = next === "COMPLETED" ? new Date() : null;
  await task.save();
  await AuditLog.create({ actorId: req.user._id, action: "WORKER_TASK_STATUS_CHANGED", entityType: "WarehouseTask", entityId: task._id, summary: `Worker ${worker.workerCode} changed task ${task.taskCode} to ${next}`, metadata: { workerId: String(worker._id), status: next } });
  res.json({ success: true, data: { task } });
});
