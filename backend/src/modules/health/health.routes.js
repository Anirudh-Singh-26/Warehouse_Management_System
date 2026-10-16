import { Router } from "express";
import mongoose from "mongoose";

const router = Router();
router.get("/", (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({
    success: ready,
    data: { status: ready ? "ok" : "database_unavailable", uptimeSeconds: Math.floor(process.uptime()) }
  });
});
export default router;
