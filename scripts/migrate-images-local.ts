import { PrismaClient } from "@prisma/client";
import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import path from "path";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

const prisma = new PrismaClient();

async function downloadToFile(url: string, dest: string) {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`Download failed: ${url} (${res.status})`);
  await pipeline(Readable.fromWeb(res.body as any), createWriteStream(dest));
}

function extFromUrl(url: string) {
  if (url.includes(".png")) return "png";
  if (url.includes(".webp")) return "webp";
  return "jpg";
}

async function main() {
  const productsDir = path.join(process.cwd(), "public", "uploads", "products");
  const avatarsDir = path.join(process.cwd(), "public", "uploads", "avatars");
  const newsDir = path.join(process.cwd(), "public", "uploads", "news");
  const promoDir = path.join(process.cwd(), "public", "uploads", "promotions");
  await mkdir(productsDir, { recursive: true });
  await mkdir(avatarsDir, { recursive: true });
  await mkdir(newsDir, { recursive: true });
  await mkdir(promoDir, { recursive: true });

  const products = await prisma.product.findMany({
    select: { id: true, slug: true, image: true, images: true },
  });

  let productOk = 0;
  for (const p of products) {
    if (!p.image || p.image.startsWith("/uploads/")) {
      productOk++;
      continue;
    }
    try {
      const ext = extFromUrl(p.image);
      const filename = `${p.slug}.${ext}`;
      const dest = path.join(productsDir, filename);
      await downloadToFile(p.image, dest);
      const localUrl = `/uploads/products/${filename}`;
      await prisma.product.update({
        where: { id: p.id },
        data: {
          image: localUrl,
          images: JSON.stringify([localUrl]),
        },
      });
      productOk++;
      console.log("Product:", p.slug);
    } catch (e) {
      console.error("Fail product", p.slug, e);
    }
  }

  const users = await prisma.user.findMany({
    select: { id: true, email: true, avatar: true },
    where: { avatar: { not: null } },
  });

  let avatarOk = 0;
  for (const u of users) {
    if (!u.avatar || u.avatar.startsWith("/uploads/")) {
      avatarOk++;
      continue;
    }
    try {
      const ext = extFromUrl(u.avatar);
      const safe = u.email.replace(/[^a-z0-9]/gi, "-");
      const filename = `${safe}.${ext}`;
      const dest = path.join(avatarsDir, filename);
      await downloadToFile(u.avatar, dest);
      const localUrl = `/uploads/avatars/${filename}`;
      await prisma.user.update({
        where: { id: u.id },
        data: { avatar: localUrl },
      });
      avatarOk++;
      console.log("Avatar:", u.email);
    } catch (e) {
      console.error("Fail avatar", u.email, e);
    }
  }

  const news = await prisma.news.findMany({ select: { id: true, slug: true, image: true } });
  for (const n of news) {
    if (!n.image || n.image.startsWith("/uploads/")) continue;
    try {
      const ext = extFromUrl(n.image);
      const filename = `${n.slug}.${ext}`;
      await downloadToFile(n.image, path.join(newsDir, filename));
      const localUrl = `/uploads/news/${filename}`;
      await prisma.news.update({ where: { id: n.id }, data: { image: localUrl } });
      console.log("News:", n.slug);
    } catch (e) {
      console.error("Fail news", n.slug, e);
    }
  }

  const promotions = await prisma.promotion.findMany({ select: { id: true, title: true, image: true } });
  let i = 0;
  for (const pr of promotions) {
    if (!pr.image || pr.image.startsWith("/uploads/")) continue;
    try {
      i++;
      const ext = extFromUrl(pr.image);
      const filename = `promo-${i}.${ext}`;
      await downloadToFile(pr.image, path.join(promoDir, filename));
      const localUrl = `/uploads/promotions/${filename}`;
      await prisma.promotion.update({ where: { id: pr.id }, data: { image: localUrl } });
      console.log("Promotion:", pr.title);
    } catch (e) {
      console.error("Fail promo", pr.title, e);
    }
  }

  // Cap nhat avatar trong review neu co
  const reviews = await prisma.review.findMany({
    where: { avatar: { not: null } },
    select: { id: true, avatar: true, userId: true },
  });
  for (const r of reviews) {
    if (!r.avatar || r.avatar.startsWith("/uploads/") || !r.userId) continue;
    const user = await prisma.user.findUnique({ where: { id: r.userId }, select: { avatar: true } });
    if (user?.avatar?.startsWith("/uploads/")) {
      await prisma.review.update({ where: { id: r.id }, data: { avatar: user.avatar } });
    }
  }

  console.log(`Done. Products local: ${productOk}/${products.length}, Avatars local: ${avatarOk}/${users.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
