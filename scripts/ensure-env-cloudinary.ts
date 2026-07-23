/**
 * Cập nhật .env: thêm Cloudinary keys nếu thiếu, giữ secret hiện có.
 */
import { existsSync, readFileSync, writeFileSync } from "fs";

const envPath = ".env";
if (!existsSync(envPath)) {
  console.error("Thiếu .env");
  process.exit(1);
}

let env = readFileSync(envPath, "utf8");
const keys = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

let changed = false;
for (const key of keys) {
  if (!new RegExp(`^${key}=`, "m").test(env)) {
    env = `${env.trimEnd()}\n${key}=""\n`;
    changed = true;
  }
}

if (!/^DATABASE_URL=.*file:\.\/dev\.db/m.test(env)) {
  // chỉ nhắc, không tự ghi đè nếu user đang dùng Neon
  console.warn("Canh bao: DATABASE_URL local nen la file:./dev.db (tru khi dang seed Neon)");
}

if (changed) {
  writeFileSync(envPath, env.endsWith("\n") ? env : env + "\n");
  console.log("Added missing Cloudinary keys to .env");
} else {
  console.log(".env Cloudinary keys OK");
}
