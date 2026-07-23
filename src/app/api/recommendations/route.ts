import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { mapProduct, apiSuccess, apiError } from "@/lib/mappers";
import {
  getSimilarProducts,
  getFrequentlyBoughtTogether,
  getPersonalizedRecommendations,
} from "@/lib/recommendations";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "personalized";
  const productId = searchParams.get("productId");
  const limit = Math.min(parseInt(searchParams.get("limit") || "4"), 12);
  const recentIds = (searchParams.get("recentIds") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    include: { category: true },
  });
  const mapped = products.map(mapProduct);

  if (type === "similar" || type === "bought-together") {
    if (!productId) return apiError("Thiếu productId");
    const base = mapped.find((p) => p.id === productId);
    if (!base) return apiError("Không tìm thấy sản phẩm", 404);
    const result =
      type === "similar"
        ? getSimilarProducts(base, mapped, limit)
        : getFrequentlyBoughtTogether(base, mapped, limit);
    return apiSuccess({ type, products: result });
  }

  if (type === "personalized" && recentIds.length) {
    const recent = recentIds
      .map((id) => mapped.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => !!p);
    if (recent.length) {
      const viewedIds = new Set(recent.map((p) => p.id));
      const categoryCount: Record<string, number> = {};
      recent.forEach((p) => {
        categoryCount[p.categorySlug] = (categoryCount[p.categorySlug] || 0) + 1;
      });
      const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0];
      const scored = mapped
        .filter((p) => !viewedIds.has(p.id))
        .map((p) => {
          let score = 0;
          if (p.categorySlug === recent[0].categorySlug) score += 40;
          if (p.categorySlug === topCategory) score += 20;
          if (p.brand === recent[0].brand) score += 15;
          score += p.rating * 2;
          if (p.isFeatured) score += 5;
          if (p.isPromotion) score += 5;
          return { product: p, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ product }) => product);
      return apiSuccess({ type, products: scored });
    }
  }

  const fallback = getPersonalizedRecommendations(mapped, limit);
  return apiSuccess({ type: "personalized", products: fallback });
}
