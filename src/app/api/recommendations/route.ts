import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { mapProduct, apiSuccess, apiError } from "@/lib/mappers";
import { getSession } from "@/lib/auth-server";
import {
  getCoPurchaseMatrix,
  getRecentSoldMap,
  getUserPurchaseHistory,
  getUserWishlistIds,
  recommendBestsellers,
  recommendBoughtTogether,
  recommendForCart,
  recommendPersonalized,
  recommendRecent,
  recommendSimilar,
} from "@/lib/recommendations";
import type { Product } from "@/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "personalized";
  const productId = searchParams.get("productId");
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") || "4", 10) || 4, 1),
    12
  );
  const recentIds = (searchParams.get("recentIds") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
  const cartIds = (searchParams.get("cartIds") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 40);
  const excludeIds = (searchParams.get("excludeIds") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const [products, matrix, recentSold, session] = await Promise.all([
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      include: { category: true },
    }),
    getCoPurchaseMatrix().catch((e) => {
      console.error("[recommendations] co-purchase matrix failed", e);
      return null;
    }),
    getRecentSoldMap(14).catch(() => new Map<string, number>()),
    getSession().catch(() => null),
  ]);

  const catalog = products.map(mapProduct);
  const ctx = {
    catalog,
    matrix,
    recentSold,
    excludeIds,
  };

  let purchasedIds: string[] = [];
  let wishlistIds: string[] = [];
  if (session?.userId && (type === "personalized" || type === "for-you")) {
    [purchasedIds, wishlistIds] = await Promise.all([
      getUserPurchaseHistory(session.userId, 40),
      getUserWishlistIds(session.userId),
    ]);
  }

  if (type === "bestsellers") {
    const result = recommendBestsellers(ctx, limit);
    return apiSuccess({
      type: "bestsellers",
      source: result.source,
      products: result.products,
      reasons: result.reasons,
      meta: {
        trendingWindowDays: 14,
        matrixOrders: matrix?.orderCount ?? 0,
      },
    });
  }

  if (type === "recent") {
    const result = recommendRecent(
      recentIds,
      catalog,
      productId || undefined,
      limit
    );
    return apiSuccess({
      type: "recent",
      source: result.source,
      products: result.products,
    });
  }

  if (type === "cart") {
    const cartProducts = cartIds
      .map((id) => catalog.find((p) => p.id === id))
      .filter((p): p is Product => !!p);
    const result = recommendForCart(cartProducts, ctx, limit);
    return apiSuccess({
      type: "cart",
      source: result.source,
      products: result.products,
      reasons: result.reasons,
    });
  }

  if (type === "similar" || type === "bought-together") {
    if (!productId) return apiError("Thiếu productId");
    const base = catalog.find((p) => p.id === productId);
    if (!base) return apiError("Không tìm thấy sản phẩm", 404);

    const result =
      type === "bought-together"
        ? recommendBoughtTogether(base, ctx, limit)
        : recommendSimilar(base, ctx, limit);

    return apiSuccess({
      type,
      source: result.source,
      products: result.products,
      reasons: result.reasons,
      meta: {
        hasCoPurchase: Boolean(matrix?.pairs.get(productId)?.size),
        matrixOrders: matrix?.orderCount ?? 0,
      },
    });
  }

  // personalized (default)
  const result = recommendPersonalized(
    {
      recentIds,
      purchasedIds,
      wishlistIds,
    },
    ctx,
    limit
  );

  return apiSuccess({
    type: "personalized",
    source: result.source,
    products: result.products,
    reasons: result.reasons,
    meta: {
      usedPurchaseHistory: purchasedIds.length > 0,
      usedWishlist: wishlistIds.length > 0,
      usedRecentViews: recentIds.length > 0,
      matrixOrders: matrix?.orderCount ?? 0,
    },
  });
}
