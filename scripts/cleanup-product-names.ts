/**
 * Làm sạch tên SP từ expand-300 (bỏ prefix kiểu "CS cá nhân", "Đồ gia dụng"...).
 * npx tsx scripts/cleanup-product-names.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PREFIXES = [
  /^CS cá nhân\s+/i,
  /^Đồ gia dụng\s+/i,
  /^Đồ uống\s+/i,
  /^Mì\/phở\s+/i,
  /^Mì\s+/i,
  /^Sữa\s+/i,
  /^Gia vị\s+/i,
  /^Bánh\/kẹo\s+/i,
  /^Bánh\s+/i,
  /^Đông lạnh\s+/i,
  /^GD\s+/i,
];

function cleanName(name: string): string {
  let n = name.trim();
  for (const re of PREFIXES) {
    n = n.replace(re, "");
  }
  return n.trim() || name;
}

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true },
  });
  let updated = 0;
  for (const p of products) {
    const next = cleanName(p.name);
    if (next !== p.name) {
      await prisma.product.update({
        where: { id: p.id },
        data: { name: next },
      });
      updated++;
    }
  }

  // Đồng bộ voucher demo theo brand mới
  const old = await prisma.voucher.findUnique({ where: { code: "ANPHU10" } });
  if (old) {
    const exists = await prisma.voucher.findUnique({ where: { code: "TAPHOA10" } });
    if (!exists) {
      await prisma.voucher.update({
        where: { code: "ANPHU10" },
        data: { code: "TAPHOA10", minOrder: 100000 },
      });
      console.log("Voucher ANPHU10 → TAPHOA10 (min 100k)");
    }
  }

  console.log(JSON.stringify({ renamed: updated, total: products.length }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
