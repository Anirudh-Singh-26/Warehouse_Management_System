import bcrypt from "bcryptjs";
import { connectDB, disconnectDB } from "../config/db.js";
import { env } from "../config/env.js";
import { User } from "../modules/users/user.model.js";
import { ROLES } from "../constants/roles.js";

async function run() {
  const name = process.env.SEED_ADMIN_NAME?.trim();
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new Error("Set SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, and SEED_ADMIN_PASSWORD in .env");
  }
  if (password.length < 12) throw new Error("Seed admin password must be at least 12 characters");
  await connectDB();
  const existing = await User.findOne({ email });
  if (existing) throw new Error("A user with this email already exists; no changes made");

  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
  const user = await User.create({ name, email, passwordHash, role: ROLES.ADMIN, status: "ACTIVE" });
  console.log(`Created admin ${user.email} (${user._id}). Store credentials securely.`);
}

run()
  .catch(err => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB().catch(() => {});
  });
