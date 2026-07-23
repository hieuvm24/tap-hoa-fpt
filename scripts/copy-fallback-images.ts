import { PrismaClient } from "@prisma/client";
import { copyFile, readdir } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  const productsDir = path.join(process.cwd(), "public", "uploads", "products");
  const promoDir = path.join(process.cwd(), "public", "uploads", "promotions");
  const files = await readdir(productsDir);
  const source = files.find((f) => f.endsWith(".jpg") && !f.includes("nuoc-mam"));
  if (!source) throw new Error("No local image to copy");
  const sourcePath = path.join(productsDir, source);
  console.log("Using source:", source);

  const remoteProducts = await prisma.product.findMany({
    where: { image: { startsWith: "https://" } },
  });

  for (const p of remoteProducts) {
    const filename = `${p.slug}.jpg`;
    await copyFile(sourcePath, path.join(productsDir, filename));
    const localUrl = `/uploads/products/${filename}`;
    await prisma.product.update({
      where: { id: p.id },
      data: { image: localUrl, images: JSON.stringify([localUrl]) },
    });
    console.log("Copied product:", p.slug);
  }

  const remotePromos = await prisma.promotion.findMany({
    where: { image: { startsWith: "https://" } },
  });
  let i = 20;
  for (const pr of remotePromos) {
    i++;
    const filename = `promo-${i}.jpg`;
    await copyFile(sourcePath, path.join(promoDir, filename));
    await prisma.promotion.update({
      where: { id: pr.id },
      data: { image: `/uploads/promotions/${filename}` },
    });
    console.log("Copied promo:", pr.title);
  }

  const leftP = await prisma.product.count({ where: { image: { startsWith: "https://" } } });
  const leftA = await prisma.user.count({
    where: { AND: [{ avatar: { not: null } }, { avatar: { startsWith: "https://" } }] },
  });
  console.log("Remaining remote products:", leftP, "avatars:", leftA);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
