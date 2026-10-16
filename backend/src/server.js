import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB, disconnectDB } from "./config/db.js";

let server;

async function start() {
  await connectDB();
  server = app.listen(env.PORT, () => {
    console.log(`Fixl Warehouse API listening on port ${env.PORT}`);
    console.log(`Environment: ${env.NODE_ENV}`);
  });
}

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down...`);
  if (server) {
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

start().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
