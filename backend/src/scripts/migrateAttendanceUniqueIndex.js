import mongoose from "mongoose";
import { env } from "../config/env.js";

await mongoose.connect(env.MONGODB_URI);
try {
  const collection = mongoose.connection.collection("attendances");
  const duplicates = await collection.aggregate([
    { $group: { _id: { workerId: "$workerId", date: "$date" }, ids: { $push: "$_id" }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $limit: 10 }
  ]).toArray();
  if (duplicates.length) {
    console.error("Duplicate worker/date attendance records exist. Resolve these before creating the unique index:");
    console.error(JSON.stringify(duplicates, null, 2));
    process.exitCode = 1;
  } else {
    const indexes = await collection.indexes();
    for (const index of indexes) {
      const sameKeys = index.key?.workerId === 1 && index.key?.date === 1 && Object.keys(index.key).length === 2;
      if (sameKeys && !index.unique) await collection.dropIndex(index.name);
    }
    await collection.createIndex({ workerId: 1, date: 1 }, { unique: true, name: "uniq_worker_attendance_date" });
    console.log("Attendance worker/date unique index is ready.");
  }
} finally {
  await mongoose.disconnect();
}
