/**
 * Cập nhật .env cho Postgres local (Docker) — giữ secret khác.
 * Chạy: npx tsx scripts/setup-env-postgres.ts
 */
import { readFileSync, writeFileSync, existsSync, copyFileSync } from "fs";
import path from "path";

const envPath = path.join(process.cwd(), ".env");
const examplePath = path.join(process.cwd(), ".env.example");
const LOCAL_PG =
  "postgresql://postgres:postgres@localhost:5432/taphoa_fpt?schema=public";

function upsert(content: string, key: string, value: string) {
  const line = `${key}="${value}"`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(content)) return content.replace(re, line);
  return `${content.trimEnd()}\n${line}\n`;
}

function getValue(content: string, key: string) {
  const m = content.match(new RegExp(`^${key}="?([^"\\n]*)"?`, "m"));
  return m?.[1]?.trim() || "";
}

function main() {
  if (!existsSync(envPath)) {
    if (existsSync(examplePath)) copyFileSync(examplePath, envPath);
    else writeFileSync(envPath, "");
  }

  let env = readFileSync(envPath, "utf8");
  env = upsert(env, "DATABASE_URL", LOCAL_PG);

  if (!getValue(env, "JWT_SECRET")) {
    env = upsert(env, "JWT_SECRET", "taphoa-fpt-dev-secret-change-me");
  }
  if (!getValue(env, "NEXT_PUBLIC_APP_URL")) {
    env = upsert(env, "NEXT_PUBLIC_APP_URL", "http://localhost:3000");
  }

  if (!/^CLOUDINARY_CLOUD_NAME=/m.test(env)) {
    env = `${env.trimEnd()}\n\n# Cloudinary (bắt buộc khi deploy Vercel)\nCLOUDINARY_CLOUD_NAME=""\nCLOUDINARY_API_KEY=""\nCLOUDINARY_API_SECRET=""\n`;
  }

  writeFileSync(envPath, env);
  console.log("Updated .env -> local Postgres Docker");
  console.log("Next: docker compose up -d && npm run db:setup && npm run dev");
}

main();
