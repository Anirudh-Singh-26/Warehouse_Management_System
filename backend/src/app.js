import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import authRoutes from "./modules/auth/auth.routes.js";
import productRoutes from "./modules/products/product.routes.js";
import inventoryRoutes from "./modules/inventory/inventory.routes.js";
import healthRoutes from "./modules/health/health.routes.js";
import phase23Routes from "./modules/operations/operations.routes.js";
import reportsRoutes from "./modules/reports/reports.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import auditRoutes from "./modules/audit/audit.routes.js";
import workerPortalRoutes from "./modules/workerPortal/workerPortal.routes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import assistantRoutes from "./modules/assistant/assistant.routes.js";

const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
  origin: env.CLIENT_ORIGIN,
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(cookieParser());
if (env.NODE_ENV !== "test") app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.use("/api/v1/auth/login", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, error: { message: "Too many login attempts. Try again later." } }
}));

app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/worker-portal", workerPortalRoutes);
app.use("/api/v1/users", usersRoutes);
app.use("/api/v1/audit-logs", auditRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/inventory", inventoryRoutes);
app.use("/api/v1/reports", reportsRoutes);
app.use("/api/v1", phase23Routes);
app.use("/api/v1/assistant", assistantRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
