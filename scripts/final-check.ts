import { readFileSync, existsSync } from "fs";
import { PrismaClient } from "@prisma/client";

function stripProvider(s: string) {
  return s
    .replace(/^\uFEFF/, "")
    .replace(/provider\s*=\s*"(sqlite|postgresql)"/, 'provider = "PROVIDER"');
}

async function main() {
  const issues: string[] = [];

  const sqlite = readFileSync("prisma/schema.sqlite.prisma", "utf8");
  const postgres = readFileSync("prisma/schema.postgres.prisma", "utf8");
  const active = readFileSync("prisma/schema.prisma", "utf8");

  if (!sqlite.includes('provider = "sqlite"')) issues.push("schema.sqlite thiếu provider sqlite");
  if (!postgres.includes('provider = "postgresql"')) issues.push("schema.postgres thiếu provider postgresql");
  if (!active.includes('provider = "sqlite"')) issues.push("schema.prisma local nên là sqlite");
  if (stripProvider(sqlite) !== stripProvider(postgres)) {
    issues.push("schema.sqlite và schema.postgres lệch model (không chỉ khác provider)");
  }

  for (const f of [
    "src/lib/storage.ts",
    "src/app/api/upload/route.ts",
    "src/components/ui/ImageUpload.tsx",
    "scripts/use-db.ts",
    "vercel.json",
    "DEPLOY.md",
  ]) {
    if (!existsSync(f)) issues.push(`Thiếu file ${f}`);
  }

  const env = readFileSync(".env", "utf8");
  if (!/DATABASE_URL=.*file:\.\/dev\.db/.test(env)) {
    issues.push(".env DATABASE_URL chưa trỏ SQLite local");
  }
  for (const k of ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"]) {
    if (!new RegExp(`^${k}=`, "m").test(env)) issues.push(`.env thiếu ${k}`);
  }

  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  if (!pkg.dependencies?.cloudinary) issues.push("package.json thiếu cloudinary");
  if (!String(pkg.scripts?.build || "").includes("use-db.ts postgres")) {
    issues.push("script build chưa chuyển postgres");
  }

  const prisma = new PrismaClient();
  const [products, customers, orders] = await Promise.all([
    prisma.product.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.order.count(),
  ]);
  await prisma.$disconnect();

  console.log(
    JSON.stringify(
      {
        ok: issues.length === 0,
        issues,
        db: { products, customers, orders },
        activeProvider: active.match(/provider\s*=\s*"(\w+)"/)?.[1],
      },
      null,
      2
    )
  );

  if (issues.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
