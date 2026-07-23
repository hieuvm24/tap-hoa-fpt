/**
 * Chọn schema Prisma:
 *   npx tsx scripts/use-db.ts sqlite
 *   npx tsx scripts/use-db.ts postgres
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";

const root = process.cwd();
const target = (process.argv[2] || "").toLowerCase();

if (target !== "sqlite" && target !== "postgres" && target !== "postgresql") {
  console.error("Usage: npx tsx scripts/use-db.ts <sqlite|postgres>");
  process.exit(1);
}

const kind = target.startsWith("postgres") ? "postgres" : "sqlite";
const src = path.join(root, "prisma", `schema.${kind}.prisma`);
const dest = path.join(root, "prisma", "schema.prisma");
const envPath = path.join(root, ".env");

if (!existsSync(src)) {
  console.error("Missing", src);
  process.exit(1);
}

const content = readFileSync(src, "utf8").replace(/^\uFEFF/, "");
writeFileSync(dest, content, "utf8");
console.log(`schema.prisma <- schema.${kind}.prisma`);

if (existsSync(envPath)) {
  let env = readFileSync(envPath, "utf8");
  if (kind === "sqlite") {
    env = env.replace(/^DATABASE_URL=.*$/m, 'DATABASE_URL="file:./dev.db"');
    writeFileSync(envPath, env);
    console.log("DATABASE_URL -> file:./dev.db");
  } else if (!/^DATABASE_URL="?postgresql/m.test(env)) {
    console.warn(
      "Canh bao: dat DATABASE_URL Postgres (Neon) trong .env / Vercel env."
    );
  }
}
