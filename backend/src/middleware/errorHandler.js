import { env } from "../config/env.js";

export function notFound(req, res) {
  res.status(404).json({
    success: false,
    error: { message: `Route not found: ${req.method} ${req.originalUrl}` }
  });
}

export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let details = err.details;

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Database validation failed";
    details = Object.values(err.errors).map(e => e.message);
  } else if (err.code === 11000) {
    statusCode = 409;
    message = "A record with this unique value already exists";
    details = err.keyValue;
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid identifier or value";
  }

  if (statusCode >= 500) {
    console.error(err);
    if (env.NODE_ENV === "production") message = "Internal server error";
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(details ? { details } : {}),
      ...(env.NODE_ENV !== "production" && err.stack ? { stack: err.stack } : {})
    }
  });
}
