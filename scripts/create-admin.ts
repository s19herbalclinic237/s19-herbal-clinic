import dotenv from "dotenv";
import path from "path";
import readline from "node:readline/promises";
import mongoose from "mongoose";
import { User } from "../lib/models/User";
import { hashPassword, isEmailValid, passwordPolicyErrors } from "../lib/auth";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

function prompt(rl: readline.Interface, question: string): Promise<string> {
  return rl.question(question);
}

async function main() {
  const uri = process.env.MONGO_URL || process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGO_URL is not set. Set it in .env.local before running this script.");
    process.exit(1);
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const email = (await prompt(rl, "Admin email: ")).trim().toLowerCase();
  const password = await prompt(rl, "Admin password (min 8 chars): ");
  rl.close();

  if (!isEmailValid(email)) {
    console.error("Invalid email address.");
    process.exit(1);
  }
  const passwordErrors = passwordPolicyErrors(password);
  if (passwordErrors.length > 0) {
    console.error(passwordErrors.join(" "));
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");

  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = "admin";
    existing.passwordHash = hashPassword(password);
    existing.emailVerified = true;
    existing.isActive = true;
    await existing.save();
    console.log(`Promoted ${email} to admin and updated its password.`);
  } else {
    await User.create({
      name: "S19 Admin",
      email,
      passwordHash: hashPassword(password),
      role: "admin",
      emailVerified: true,
    });
    console.log(`Created admin account for ${email}.`);
  }

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});