import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { mapProduct, apiSuccess, apiError } from "@/lib/mappers";
import {
  getSimilarProducts,
  getFrequentlyBoughtTogether,
  getPersonalizedRecommendations,
  getCartRecommendations,
  getBestsellers,
} from "@/lib/recommendations";
import type { Product } from "@/types";

/** Sản phẩm thường xuất hiện cùng trong đơn hàng thật */
async function getCoPurchasedFromOrders(
  productId: string,
  catalog: Product[],
  limit: number
): Promise<Product[] | null> {
  const orderLinks = await prisma.orderItem.findMany({
    where: {
      productId,
      order: { status: { not: "cancelled" } },
    },
    select: { orderId: true },
    take: 80,
  });
  const orderIds = [...new Set(orderLinks.map((o) => o.orderId))];
  if (orderIds.length < 2) return null;

  const coItems = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      orderId: { in: orderIds },
      productId: { not: productId },
    },
    _count: { productId: true },
    orderBy: { _count: { productId: "desc" } },
    take: limit * 3,
  });

  if (!coItems.length) return null;

  const byId = Object.fromEntries(catalog.map((p) => [p.id, p]));
  const result: Product[] = [];
  for (const row of coItems) {
    const p = byId[row.productId];
    if (p && p.stock > 0) {
      result.push(p);
      if (result.length >= limit) break;
    }
  }
  return result.length ? result : null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "personalized";
  const productId = searchParams.get("productId");
  const limit = Math.min(parseInt(searchParams.get("limit") || "4"), 12);
  const recentIds = (searchParams.get("recentIds") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const cartIds = (searchParams.get("cartIds") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    include: { category: true },
  });
  const mapped = products.map(mapProduct);

  if (type === "bestsellers") {
    return apiSuccess({
      type: "bestsellers",
      products: getBestsellers(mapped, limit),
    });
  }

  if (type === "cart") {
    const cartProducts = cartIds
      .map((id) => mapped.find((p) => p.id === id))
      .filter((p): p is Product => !!p);
    return apiSuccess({
      type: "cart",
      products: getCartRecommendations(cartProducts, mapped, limit),
    });
  }

  if (type === "similar" || type === "bought-together") {
    if (!productId) return apiError("Thiếu productId");
    const base = mapped.find((p) => p.id === productId);
    if (!base) return apiError("Không tìm thấy sản phẩm", 404);

    if (type === "bought-together") {
      const fromOrders = await getCoPurchasedFromOrders(
        productId,
        mapped,
        limit
      );
      if (fromOrders?.length) {
        return apiSuccess({
          type: "bought-together",
          source: "orders",
          products: fromOrders,
        });
      }
      return apiSuccess({
        type: "bought-together",
        source: "rules",
        products: getFrequentlyBoughtTogether(base, mapped, limit),
      });
    }

    return apiSuccess({
      type: "similar",
      products: getSimilarProducts(base, mapped, limit),
    });
  }

  if (type === "personalized" && recentIds.length) {
    const recent = recentIds
      .map((id) => mapped.find((p) => p.id === id))
      .filter((p): p is Product => !!p);
    if (recent.length) {
      const viewedIds = new Set(recent.map((p) => p.id));
      const categoryCount: Record<string, number> = {};
      recent.forEach((p) => {
        categoryCount[p.categorySlug] =
          (categoryCount[p.categorySlug] || 0) + 1;
      });
      const topCategory = Object.entries(categoryCount).sort(
        (a, b) => b[1] - a[1]
      )[0]?.[0];
      const scored = mapped
        .filter((p) => !viewedIds.has(p.id))
        .map((p) => {
          let score = 0;
          if (p.categorySlug === recent[0].categorySlug) score += 40;
          if (p.categorySlug === topCategory) score += 20;
          if (p.brand === recent[0].brand) score += 15;
          score += p.rating * 2;
          score += Math.min(p.soldCount || 0, 40) * 0.2;
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
