import { PrismaClient } from "@prisma/client";
import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import path from "path";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

const prisma = new PrismaClient();

const FALLBACK = {
  giaVi: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop",
  banhKeo: "https://images.unsplash.com/photo-1499636139340-9ba9dc2af9d5?w=400&h=400&fit=crop",
};

async function downloadToFile(url: string, dest: string) {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`Download failed: ${url} (${res.status})`);
  await pipeline(Readable.fromWeb(res.body as any), createWriteStream(dest));
}

async function main() {
  const productsDir = path.join(process.cwd(), "public", "uploads", "products");
  const promoDir = path.join(process.cwd(), "public", "uploads", "promotions");
  await mkdir(productsDir, { recursive: true });
  await mkdir(promoDir, { recursive: true });

  const failedProducts = await prisma.product.findMany({
    where: { image: { startsWith: "https://" } },
    include: { category: true },
  });

  for (const p of failedProducts) {
    const url =
      p.category.slug === "banh-keo" ? FALLBACK.banhKeo : FALLBACK.giaVi;
    const filename = `${p.slug}.jpg`;
    const dest = path.join(productsDir, filename);
    await downloadToFile(url, dest);
    const localUrl = `/uploads/products/${filename}`;
    await prisma.product.update({
      where: { id: p.id },
      data: { image: localUrl, images: JSON.stringify([localUrl]) },
    });
    console.log("Fixed product:", p.slug);
  }

  const failedPromos = await prisma.promotion.findMany({
    where: { image: { startsWith: "https://" } },
  });
  let i = 10;
  for (const pr of failedPromos) {
    i++;
    const filename = `promo-${i}.jpg`;
    await downloadToFile(FALLBACK.banhKeo, path.join(promoDir, filename));
    const localUrl = `/uploads/promotions/${filename}`;
    await prisma.promotion.update({
      where: { id: pr.id },
      data: { image: localUrl },
    });
    console.log("Fixed promo:", pr.title);
  }

  const remaining = await prisma.product.count({
    where: { image: { startsWith: "https://" } },
  });
  console.log("Remaining remote product images:", remaining);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
