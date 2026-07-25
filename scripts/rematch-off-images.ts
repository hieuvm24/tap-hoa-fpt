/**
 * Gắn lại ảnh Open Food Facts cho hàng đóng gói (bỏ Unsplash chung chung).
 * Rau/củ & trái cây giữ Unsplash (OFF ít ảnh tươi).
 *
 * npx tsx scripts/rematch-off-images.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PRODUCE = new Set(["rau-cu", "trai-cay"]);

const offCache = new Map<string, string | null>();

async function fetchOffImage(query: string): Promise<string | null> {
  const key = query.toLowerCase().trim();
  if (!key) return null;
  if (offCache.has(key)) return offCache.get(key)!;
  try {
    const url =
      "https://world.openfoodfacts.org/cgi/search.pl?" +
      new URLSearchParams({
        search_terms: query,
        search_simple: "1",
        action: "process",
        json: "1",
        page_size: "12",
      });
    const res = await fetch(url, {
      headers: {
        "User-Agent": "TapHoaFPT/1.0 (graduation thesis; demo store)",
      },
    });
    if (!res.ok) {
      offCache.set(key, null);
      return null;
    }
    const data = (await res.json()) as {
      products?: {
        image_front_url?: string;
        image_url?: string;
        product_name?: string;
        brands?: string;
      }[];
    };
    const hit = data.products?.find((p) => p.image_front_url || p.image_url);
    const img = hit?.image_front_url || hit?.image_url || null;
    offCache.set(key, img);
    return img;
  } catch {
    offCache.set(key, null);
    return null;
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Tách từ khóa tìm ảnh từ tên VN */
function queriesFor(name: string, brand: string | null): string[] {
  const cleaned = name
    .replace(/^(Đồ uống|Mì|Sữa|Gia vị|Bánh|Đông lạnh|GD|CS cá nhân)\s+/i, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\b(330ml|500ml|1L|1\.5L|180ml|gói|hộp|chai|lon|túi)\b/gi, "")
    .trim();
  const qs: string[] = [];
  if (brand && brand.length > 1) qs.push(brand);
  if (cleaned) qs.push(cleaned);
  // brand + first significant word
  const words = cleaned.split(/\s+/).filter((w) => w.length > 2);
  if (brand && words[0]) qs.push(`${brand} ${words[0]}`);
  if (words.length >= 2) qs.push(words.slice(0, 2).join(" "));
  return [...new Set(qs.map((q) => q.trim()).filter(Boolean))];
}

async function main() {
  console.log("Rematch packaged products → Open Food Facts images...");
  const products = await prisma.product.findMany({
    include: { category: { select: { slug: true } } },
  });

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const p of products) {
    if (PRODUCE.has(p.category.slug)) {
      skipped++;
      continue;
    }
    // Đã có ảnh OFF ổn → bỏ qua
    if (p.image.includes("openfoodfacts.org")) {
      skipped++;
      continue;
    }

    const qs = queriesFor(p.name, p.brand);
    let img: string | null = null;
    for (const q of qs) {
      img = await fetchOffImage(q);
      await sleep(200);
      if (img) break;
    }

    if (!img) {
      failed++;
      continue;
    }

    await prisma.product.update({
      where: { id: p.id },
      data: {
        image: img,
        images: JSON.stringify([img]),
      },
    });
    updated++;
    if (updated % 15 === 0) {
      console.log(`updated ${updated} (failed so far ${failed})`);
    }
  }

  const off = await prisma.product.count({
    where: { image: { contains: "openfoodfacts" } },
  });
  console.log(
    JSON.stringify(
      { updated, skippedProduceOrAlreadyOff: skipped, noOffMatch: failed, totalOffImages: off },
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
