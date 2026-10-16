import mongoose from "mongoose";
import { ApiError } from "../../utils/apiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getPagination, paginationMeta } from "../../utils/pagination.js";
import { AuditLog } from "../audit/audit.model.js";
import { receiveStock, dispatchStock, recordReturnedStock } from "../inventory/inventory.service.js";
import {
  Supplier, TransportProvider, Vehicle, Driver, Worker, Attendance, WarehouseTask,
  BonusRecord, Shipment, StaffingAgency, Expense
} from "./models.js";

const configs = {
  suppliers: { Model: Supplier, entity: "Supplier", action: "SUPPLIER", search: ["code","name","phone","email"] },
  "transport-providers": { Model: TransportProvider, entity: "TransportProvider", action: "TRANSPORT_PROVIDER", search: ["code","name","phone","email"] },
  vehicles: { Model: Vehicle, entity: "Vehicle", action: "VEHICLE", search: ["registrationNumber"] },
  drivers: { Model: Driver, entity: "Driver", action: "DRIVER", search: ["name","phone","licenseNumber"] },
  workers: { Model: Worker, entity: "Worker", action: "WORKER", search: ["workerCode","name","phone","agencyName"] },
  attendance: { Model: Attendance, entity: "Attendance", action: "ATTENDANCE", search: ["date","status"] },
  tasks: { Model: WarehouseTask, entity: "WarehouseTask", action: "TASK", search: ["taskCode","title","status"] },
  "bonus-records": { Model: BonusRecord, entity: "BonusRecord", action: "BONUS_RECORD", search: ["criteria"] },
  shipments: { Model: Shipment, entity: "Shipment", action: "SHIPMENT", search: ["shipmentCode","orderReference","customerName","trackingNumber"] },
  "staffing-agencies": { Model: StaffingAgency, entity: "StaffingAgency", action: "STAFFING_AGENCY", search: ["code","name","contactName","phone","email"] },
  expenses: { Model: Expense, entity: "Expense", action: "EXPENSE", search: ["expenseCode","category","reference","supplierName","description"] }
};
function safeRegex(s) { return String(s).slice(0,100).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function audit(user, action, entityType, entityId, summary, metadata={}) {
  return AuditLog.create({ actorId:user._id, action, entityType, entityId, summary, metadata });
}
export const listResource = asyncHandler(async (req,res) => {
  const cfg=configs[req.params.resource];
  if(!cfg) throw new ApiError(404,"Resource not found");
  const {page,limit,skip}=getPagination(req.query);
  const filter={};
  if(req.query.status && cfg.Model.schema.path("status")) filter.status=String(req.query.status).toUpperCase();
  if(req.query.search) {
    const term=safeRegex(req.query.search);
    filter.$or=cfg.search.map(field=>({[field]:{$regex:term,$options:"i"}}));
  }
  if(req.query.workerId && cfg.Model.schema.path("workerId")) {
    if(!mongoose.isValidObjectId(req.query.workerId)) throw new ApiError(400,"Invalid workerId");
    filter.workerId=req.query.workerId;
  }
  if(req.query.productId && cfg.Model.schema.path("productId")) {
    if(!mongoose.isValidObjectId(req.query.productId)) throw new ApiError(400,"Invalid productId");
    filter.productId=req.query.productId;
  }
  if(req.query.date && cfg.Model.schema.path("date")) filter.date=req.query.date;
  const [data,total]=await Promise.all([
    cfg.Model.find(filter).sort({createdAt:-1,_id:-1}).skip(skip).limit(limit).lean(),
    cfg.Model.countDocuments(filter)
  ]);
  res.json({success:true,data,meta:paginationMeta(total,page,limit)});
});
export const createResource = asyncHandler(async(req,res)=>{
  const cfg=configs[req.params.resource];
  if(!cfg) throw new ApiError(404,"Resource not found");
  const payload={...req.validatedBody};
  if(cfg.Model===Attendance || cfg.Model===Expense) payload.recordedBy=req.user._id;
  else payload.createdBy=req.user._id;
  if(cfg.Model===Expense) payload.expenseDate=new Date(payload.expenseDate);
  if(cfg.Model===Shipment) payload.updatedBy=req.user._id;
  const dateFieldsByModel = new Map([
    [Driver, ["licenseExpiry"]],
    [Vehicle, ["insuranceExpiry", "permitExpiry", "fitnessExpiry", "lastServiceAt", "nextServiceDueAt"]],
    [Worker, ["joinedAt", "contractEndAt"]],
    [Shipment, ["expectedDeliveryAt"]],
  ]);
  for (const field of dateFieldsByModel.get(cfg.Model) || []) {
    if (payload[field]) payload[field] = new Date(payload[field]);
  }
  if(cfg.Model===Attendance) {
    payload.checkIn=payload.checkIn?new Date(payload.checkIn):null;
    payload.checkOut=payload.checkOut?new Date(payload.checkOut):null;
    const worker=await Worker.findById(payload.workerId);
    if(!worker) throw new ApiError(404,"Worker not found");
    if(await Attendance.exists({workerId:payload.workerId,date:payload.date})) {
      throw new ApiError(409,"Attendance is already recorded for this worker and date");
    }
  }
  if(cfg.Model===WarehouseTask && payload.workerId) {
    if(!await Worker.exists({_id:payload.workerId})) throw new ApiError(404,"Worker not found");
    if(payload.status==="COMPLETED") payload.completedAt=new Date();
  }
  if(cfg.Model===BonusRecord) {
    if(!await Worker.exists({_id:payload.workerId})) throw new ApiError(404,"Worker not found");
    payload.periodStart=new Date(payload.periodStart); payload.periodEnd=new Date(payload.periodEnd);
    payload.approved=false;
    payload.approvalStatus="PENDING";
    payload.approvedBy=null;
    payload.approvedAt=null;
  }
  if(cfg.Model===Expense && payload.shipmentId && !await Shipment.exists({_id:payload.shipmentId})) throw new ApiError(404,"Shipment not found");
  if(cfg.Model===Shipment) {
    if(!payload.trackingEvents?.length) {
      payload.trackingEvents = [{
        status: "DRAFT",
        location: "",
        notes: "Shipment record created",
        occurredAt: new Date(),
        recordedBy: req.user._id
      }];
    }
    if(!await mongoose.model("Product").exists({_id:payload.productId,status:"ACTIVE"})) throw new ApiError(404,"Active product not found");
    if(payload.transportProviderId && !await TransportProvider.exists({_id:payload.transportProviderId,status:"ACTIVE"})) throw new ApiError(404,"Active transport provider not found");
    if(payload.vehicleId && !await Vehicle.exists({_id:payload.vehicleId,status:{$in:["AVAILABLE","IN_USE"]}})) throw new ApiError(404,"Available vehicle not found");
    if(payload.driverId && !await Driver.exists({_id:payload.driverId,status:{$in:["AVAILABLE","ASSIGNED"]}})) throw new ApiError(404,"Available driver not found");
  }
  const doc=await cfg.Model.create(payload);
  await audit(req.user,`${cfg.action}_CREATED`,cfg.entity,doc._id,`Created ${cfg.entity} record`);
  res.status(201).json({success:true,data:doc});
});
export const getResource = asyncHandler(async(req,res)=>{
  const cfg=configs[req.params.resource];
  if(!cfg) throw new ApiError(404,"Resource not found");
  const doc=await cfg.Model.findById(req.params.id);
  if(!doc) throw new ApiError(404,`${cfg.entity} not found`);
  res.json({success:true,data:doc});
});
export const updateResource = asyncHandler(async(req,res)=>{
  const cfg=configs[req.params.resource];
  if(!cfg) throw new ApiError(404,"Resource not found");
  const doc=await cfg.Model.findById(req.params.id);
  if(!doc) throw new ApiError(404,`${cfg.entity} not found`);
  if(cfg.Model===Attendance && req.validatedBody.workerId && !await Worker.exists({_id:req.validatedBody.workerId})) throw new ApiError(404,"Worker not found");
  if(cfg.Model===Attendance && (req.validatedBody.workerId || req.validatedBody.date)) {
    const workerId=req.validatedBody.workerId || doc.workerId;
    const date=req.validatedBody.date || doc.date;
    if(await Attendance.exists({_id:{$ne:doc._id},workerId,date})) throw new ApiError(409,"Attendance is already recorded for this worker and date");
  }
  if(cfg.Model===WarehouseTask && req.validatedBody.workerId && !await Worker.exists({_id:req.validatedBody.workerId})) throw new ApiError(404,"Worker not found");
  const before = Object.fromEntries(Object.keys(req.validatedBody).map((key) => [key, doc[key] ?? null]));
  Object.assign(doc,req.validatedBody);
  if (cfg.Model.schema.path("updatedBy")) doc.updatedBy = req.user._id;
  if(cfg.Model===Attendance) {
    if(req.validatedBody.checkIn!==undefined) doc.checkIn=req.validatedBody.checkIn?new Date(req.validatedBody.checkIn):null;
    if(req.validatedBody.checkOut!==undefined) doc.checkOut=req.validatedBody.checkOut?new Date(req.validatedBody.checkOut):null;
  }
  if(cfg.Model===Expense && req.validatedBody.expenseDate) doc.expenseDate=new Date(req.validatedBody.expenseDate);
  const dateFieldsByModel = new Map([
    [Driver, ["licenseExpiry"]],
    [Vehicle, ["insuranceExpiry", "permitExpiry", "fitnessExpiry", "lastServiceAt", "nextServiceDueAt"]],
    [Worker, ["joinedAt", "contractEndAt"]],
    [Shipment, ["expectedDeliveryAt"]],
  ]);
  for (const field of dateFieldsByModel.get(cfg.Model) || []) {
    if (req.validatedBody[field] !== undefined) {
      doc[field] = req.validatedBody[field] ? new Date(req.validatedBody[field]) : null;
    }
  }
  if(cfg.Model===BonusRecord) {
    if(req.validatedBody.periodStart) doc.periodStart=new Date(req.validatedBody.periodStart);
    if(req.validatedBody.periodEnd) doc.periodEnd=new Date(req.validatedBody.periodEnd);
  }

  await doc.save();
  const after = Object.fromEntries(Object.keys(req.validatedBody).map((key) => [key, doc[key] ?? null]));
  await audit(req.user,`${cfg.action}_UPDATED`,cfg.entity,doc._id,`Updated ${cfg.entity} record`,{before,after});
  res.json({success:true,data:doc});
});
export const deleteResource = asyncHandler(async(req,res)=>{
  const cfg=configs[req.params.resource];
  if(!cfg) throw new ApiError(404,"Resource not found");
  if([Shipment,Attendance,BonusRecord].includes(cfg.Model)) throw new ApiError(409,"This record is retained for audit; change its status instead");
  const doc=await cfg.Model.findById(req.params.id);
  if(!doc) throw new ApiError(404,`${cfg.entity} not found`);
  await doc.deleteOne();
  await audit(req.user,`${cfg.action}_DELETED`,cfg.entity,doc._id,`Deleted ${cfg.entity} record`);
  res.json({success:true,message:`${cfg.entity} deleted`});
});

const allowedTransitions={
 DRAFT:["READY","CANCELLED"], READY:["DISPATCHED","CANCELLED"], DISPATCHED:["IN_TRANSIT","DELIVERED","FAILED"],
 IN_TRANSIT:["DELIVERED","FAILED"], FAILED:["RETURNED"], DELIVERED:[], RETURNED:[], CANCELLED:[]
};
export const updateShipmentStatus=asyncHandler(async(req,res)=>{
 const shipment=await Shipment.findById(req.params.id);
 if(!shipment) throw new ApiError(404,"Shipment not found");
 const current=shipment.status;
 const next=req.validatedBody.status;
 if(!allowedTransitions[current]?.includes(next)) throw new ApiError(409,`Invalid shipment transition: ${current} -> ${next}`);

 // Atomically claim the transition first. Concurrent requests cannot dispatch the
 // same shipment twice and deduct inventory twice. If stock processing fails,
 // restore the previous status.
 const now=new Date();
 const setFields={status:next,updatedBy:req.user._id};
 if(req.validatedBody.notes) setFields.notes=req.validatedBody.notes;
 if(next==="DISPATCHED") setFields.dispatchedAt=now;
 if(next==="DELIVERED") setFields.deliveredAt=now;
 const claimed=await Shipment.findOneAndUpdate(
   {_id:shipment._id,status:current},{$set:setFields},{new:true,runValidators:true}
 );
 if(!claimed) throw new ApiError(409,"Shipment was updated by another request; refresh and retry");

 try {
   if(next==="DISPATCHED") {
     await dispatchStock({productId:String(shipment.productId),quantity:shipment.quantity,reference:shipment.shipmentCode,reason:`Shipment ${shipment.shipmentCode} dispatched`},req.user);
     if(shipment.vehicleId) await Vehicle.updateOne({_id:shipment.vehicleId,status:"AVAILABLE"},{$set:{status:"IN_USE"}});
     if(shipment.driverId) await Driver.updateOne({_id:shipment.driverId,status:"AVAILABLE"},{$set:{status:"ASSIGNED"}});
   }
   if(next==="RETURNED") {
     await recordReturnedStock({productId:String(shipment.productId),quantity:shipment.quantity,reference:shipment.shipmentCode,reason:`Returned shipment ${shipment.shipmentCode}; quarantine pending inspection`},req.user);
     if(shipment.vehicleId) await Vehicle.updateOne({_id:shipment.vehicleId},{$set:{status:"AVAILABLE"}});
     if(shipment.driverId) await Driver.updateOne({_id:shipment.driverId},{$set:{status:"AVAILABLE"}});
   }
   if(next==="DELIVERED") {
     if(shipment.vehicleId) await Vehicle.updateOne({_id:shipment.vehicleId},{$set:{status:"AVAILABLE"}});
     if(shipment.driverId) await Driver.updateOne({_id:shipment.driverId},{$set:{status:"AVAILABLE"}});
   }
 } catch(error) {
   const rollback={status:current,updatedBy:req.user._id};
   if(next==="DISPATCHED") rollback.dispatchedAt=shipment.dispatchedAt ?? null;
   if(next==="DELIVERED") rollback.deliveredAt=shipment.deliveredAt ?? null;
   await Shipment.updateOne({_id:shipment._id,status:next},{$set:rollback});
   throw error;
 }
 await Shipment.updateOne(
   { _id: claimed._id, status: next },
   { $push: { trackingEvents: {
     status: next,
     location: req.validatedBody.location || "",
     notes: req.validatedBody.notes || "",
     occurredAt: now,
     recordedBy: req.user._id
   } } }
 );
 const updatedShipment = await Shipment.findById(claimed._id);
 await audit(req.user,"SHIPMENT_STATUS_CHANGED","Shipment",claimed._id,`Shipment ${claimed.shipmentCode}: ${next}`,{previousStatus:current,status:next,location:req.validatedBody.location || ""});
 res.json({success:true,data:updatedShipment});
});

const taskTransitions = {
  PENDING: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["PENDING", "COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: []
};

export const updateTaskStatus = asyncHandler(async (req, res) => {
  const task = await WarehouseTask.findById(req.params.id);
  if (!task) throw new ApiError(404, "Task not found");
  const current = task.status;
  const next = req.validatedBody.status;
  if (!taskTransitions[current]?.includes(next)) {
    throw new ApiError(409, `Invalid task transition: ${current} -> ${next}`);
  }
  const set = { status: next };
  if (next === "COMPLETED") set.completedAt = new Date();
  else if (current === "COMPLETED") set.completedAt = null;
  const updated = await WarehouseTask.findOneAndUpdate(
    { _id: task._id, status: current },
    { $set: set },
    { new: true, runValidators: true }
  );
  if (!updated) throw new ApiError(409, "Task was updated by another request; refresh and retry");
  await audit(req.user, "TASK_STATUS_CHANGED", "WarehouseTask", updated._id,
    `Task ${updated.taskCode}: ${current} -> ${next}`, { previousStatus: current, status: next });
  res.json({ success: true, data: updated });
});

export const updateBonusApproval = asyncHandler(async (req, res) => {
  const bonus = await BonusRecord.findById(req.params.id);
  if (!bonus) throw new ApiError(404, "Bonus record not found");
  if (bonus.approvalStatus !== "PENDING") {
    throw new ApiError(409, `Bonus record has already been ${bonus.approvalStatus.toLowerCase()}`);
  }
  const decision = req.validatedBody.decision;
  if (decision === "APPROVED" && !bonus.eligible) {
    throw new ApiError(409, "An ineligible bonus record cannot be approved");
  }
  bonus.approvalStatus = decision;
  bonus.approved = decision === "APPROVED";
  bonus.approvalNote = req.validatedBody.approvalNote || "";
  bonus.approvedAt = new Date();
  bonus.approvedBy = req.user._id;
  await bonus.save();
  await audit(req.user, `BONUS_${decision}`, "BonusRecord", bonus._id,
    `${decision === "APPROVED" ? "Approved" : "Rejected"} bonus record`, { amount: bonus.amount, workerId: String(bonus.workerId) });
  res.json({ success: true, data: bonus });
});
