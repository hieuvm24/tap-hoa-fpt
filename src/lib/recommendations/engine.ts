/**
 * Hybrid recommendation engine — tạp hóa / mini-mart.
 *
 * Tín hiệu:
 * 1. Collaborative (co-purchase từ đơn hàng)
 * 2. Content-based (danh mục, brand, giá, tên)
 * 3. Popularity + trending (14 ngày)
 * 4. Context (recent views / cart / purchase / wishlist)
 * 5. Diversity (MMR-lite)
 */

import type { Product } from "@/types";
import { relatedCategories } from "./categories";
import {
  type CoPurchaseMatrix,
  aggregateCoPurchase,
  coPurchaseScore,
  topCoPurchased,
} from "./copurchase";
import {
  type ScoredProduct,
  contentSimilarity,
  diversify,
  isRecommendable,
  normalizeScores,
  popularityScore,
  reasonsMap,
  toProducts,
} from "./scoring";

export type RecommendResult = {
  products: Product[];
  source: "hybrid" | "orders" | "content" | "popularity";
  reasons?: Record<string, string>;
};

export type EngineContext = {
  catalog: Product[];
  matrix?: CoPurchaseMatrix | null;
  recentSold?: Map<string, number>;
  excludeIds?: string[];
};

function catalogIndex(catalog: Product[]): Map<string, Product> {
  return new Map(catalog.map((p) => [p.id, p]));
}

function excludeSet(...groups: (string[] | undefined)[]): Set<string> {
  const s = new Set<string>();
  for (const g of groups) {
    if (g) for (const id of g) s.add(id);
  }
  return s;
}

function mergeHybrid(
  content: ScoredProduct[],
  collab: ScoredProduct[],
  pop: ScoredProduct[],
  weights: { content: number; collab: number; pop: number }
): ScoredProduct[] {
  const cN = normalizeScores(content);
  const kN = normalizeScores(collab);
  const pN = normalizeScores(pop);
  const byId = new Map<string, ScoredProduct>();

  const add = (list: ScoredProduct[], w: number, defaultReason?: string) => {
    for (const item of list) {
      const prev = byId.get(item.product.id);
      const addScore = item.score * w;
      if (!prev) {
        byId.set(item.product.id, {
          product: item.product,
          score: addScore,
          reason: item.reason || defaultReason,
        });
      } else {
        prev.score += addScore;
        // Giữ reason “mạnh” hơn (collab > content)
        if (item.reason && (!prev.reason || w >= weights.collab)) {
          prev.reason = item.reason;
        }
      }
    }
  };

  add(cN, weights.content, "Gợi ý theo sở thích sản phẩm");
  add(kN, weights.collab, "Thường được mua cùng");
  add(pN, weights.pop, "Đang được quan tâm");

  return [...byId.values()].sort((a, b) => b.score - a.score);
}

function scoreContentNeighbors(
  seeds: Product[],
  catalog: Product[],
  exclude: Set<string>
): ScoredProduct[] {
  if (!seeds.length) return [];
  const seedIds = new Set(seeds.map((s) => s.id));
  return catalog
    .filter((p) => isRecommendable(p, exclude) && !seedIds.has(p.id))
    .map((p) => {
      let score = 0;
      let bestReason = "Sản phẩm tương tự";
      for (let i = 0; i < seeds.length; i++) {
        const w = 1 / (1 + i * 0.35);
        const sim = contentSimilarity(seeds[i], p);
        score += sim * w;
        if (sim >= 40 && seeds[i].categorySlug === p.categorySlug) {
          bestReason = `Cùng danh mục ${p.category}`;
        } else if (
          relatedCategories(seeds[i].categorySlug).includes(p.categorySlug)
        ) {
          bestReason = "Thường dùng kèm";
        }
      }
      score += popularityScore(p) * 0.08;
      return { product: p, score, reason: bestReason };
    })
    .filter((x) => x.score > 0);
}

function scoreCollabNeighbors(
  matrix: CoPurchaseMatrix | null | undefined,
  seedIds: string[],
  catalog: Product[],
  exclude: Set<string>
): ScoredProduct[] {
  if (!matrix || !seedIds.length) return [];
  const byId = catalogIndex(catalog);
  const agg = aggregateCoPurchase(matrix, seedIds, exclude);
  const out: ScoredProduct[] = [];
  for (const [id, v] of agg) {
    const p = byId.get(id);
    if (!p || !isRecommendable(p, exclude)) continue;
    out.push({
      product: p,
      score: v.score,
      reason:
        v.fromSeeds > 1
          ? "Hay mua kèm các món bạn chọn"
          : v.coCount >= 3
            ? "Thường mua cùng trong đơn hàng"
            : "Gợi ý từ đơn hàng tương tự",
    });
  }
  return out;
}

function scorePopularity(
  catalog: Product[],
  exclude: Set<string>,
  recentSold?: Map<string, number>
): ScoredProduct[] {
  return catalog
    .filter((p) => isRecommendable(p, exclude))
    .map((p) => ({
      product: p,
      score: popularityScore(p, recentSold),
      reason:
        (recentSold?.get(p.id) || 0) > 0
          ? "Bán chạy gần đây"
          : "Bán chạy tại cửa hàng",
    }));
}

function finalize(
  scored: ScoredProduct[],
  limit: number,
  source: RecommendResult["source"],
  hasCollab: boolean
): RecommendResult {
  const picked = diversify(scored, limit);
  return {
    products: toProducts(picked),
    source: hasCollab && source === "hybrid" ? "hybrid" : source,
    reasons: reasonsMap(picked),
  };
}

/** Sản phẩm tương tự (PDP) */
export function recommendSimilar(
  product: Product,
  ctx: EngineContext,
  limit = 4
): RecommendResult {
  const exclude = excludeSet(ctx.excludeIds, [product.id]);
  const content = scoreContentNeighbors([product], ctx.catalog, exclude);
  const collab = scoreCollabNeighbors(
    ctx.matrix,
    [product.id],
    ctx.catalog,
    exclude
  );
  const pop = scorePopularity(ctx.catalog, exclude, ctx.recentSold).slice(
    0,
    40
  );

  const hasCollab = collab.length > 0;
  const merged = mergeHybrid(content, collab, pop, {
    content: 0.55,
    collab: 0.25,
    pop: 0.2,
  });
  return finalize(
    merged,
    limit,
    hasCollab ? "hybrid" : "content",
    hasCollab
  );
}

/** Thường mua kèm (PDP) — ưu tiên CF */
export function recommendBoughtTogether(
  product: Product,
  ctx: EngineContext,
  limit = 4
): RecommendResult {
  const exclude = excludeSet(ctx.excludeIds, [product.id]);
  const content = scoreContentNeighbors([product], ctx.catalog, exclude);
  // Cross-category bias cho bought-together: giảm điểm cùng category
  const contentCross = content.map((s) => ({
    ...s,
    score:
      s.product.categorySlug === product.categorySlug
        ? s.score * 0.55
        : s.score * 1.15,
    reason:
      s.product.categorySlug === product.categorySlug
        ? s.reason
        : "Thường mua kèm",
  }));
  const collab = scoreCollabNeighbors(
    ctx.matrix,
    [product.id],
    ctx.catalog,
    exclude
  );
  const pop = scorePopularity(ctx.catalog, exclude, ctx.recentSold).slice(
    0,
    30
  );

  const hasCollab = collab.some((c) => (c.score || 0) > 0);
  const merged = mergeHybrid(contentCross, collab, pop, {
    content: hasCollab ? 0.22 : 0.5,
    collab: hasCollab ? 0.58 : 0.1,
    pop: 0.2,
  });
  return finalize(
    merged,
    limit,
    hasCollab ? "hybrid" : "content",
    hasCollab
  );
}

/** Bán chạy + trending */
export function recommendBestsellers(
  ctx: EngineContext,
  limit = 4
): RecommendResult {
  const exclude = excludeSet(ctx.excludeIds);
  const pop = scorePopularity(ctx.catalog, exclude, ctx.recentSold);
  const picked = diversify(pop, limit, 0.85);
  return {
    products: toProducts(picked),
    source: "popularity",
    reasons: reasonsMap(picked),
  };
}

/** Gợi ý theo giỏ hàng */
export function recommendForCart(
  cartProducts: Product[],
  ctx: EngineContext,
  limit = 4
): RecommendResult {
  if (!cartProducts.length) {
    return recommendBestsellers(ctx, limit);
  }
  const cartIds = cartProducts.map((p) => p.id);
  const exclude = excludeSet(ctx.excludeIds, cartIds);

  const content = scoreContentNeighbors(cartProducts, ctx.catalog, exclude);
  const collab = scoreCollabNeighbors(
    ctx.matrix,
    cartIds,
    ctx.catalog,
    exclude
  );
  const pop = scorePopularity(ctx.catalog, exclude, ctx.recentSold).slice(
    0,
    40
  );

  // Ưu tiên giá gần trung bình giỏ
  const avg =
    cartProducts.reduce((s, c) => s + c.price, 0) / cartProducts.length;
  const priced = content.map((s) => {
    const diff = Math.abs(s.product.price - avg) / Math.max(avg, 1);
    const boost = diff <= 0.35 ? 8 : diff <= 0.6 ? 3 : 0;
    return { ...s, score: s.score + boost };
  });

  const hasCollab = collab.length > 0;
  const merged = mergeHybrid(priced, collab, pop, {
    content: 0.35,
    collab: hasCollab ? 0.45 : 0.15,
    pop: 0.2,
  });
  return finalize(merged, limit, hasCollab ? "hybrid" : "content", hasCollab);
}

export type PersonalizedInput = {
  recentIds?: string[];
  purchasedIds?: string[];
  wishlistIds?: string[];
};

/**
 * Gợi ý cá nhân: browse + mua hàng + wishlist + CF mở rộng.
 * Grocery: cho phép “mua lại” staples với điểm thấp hơn SP mới.
 */
export function recommendPersonalized(
  input: PersonalizedInput,
  ctx: EngineContext,
  limit = 4
): RecommendResult {
  const recentIds = input.recentIds || [];
  const purchasedIds = input.purchasedIds || [];
  const wishlistIds = input.wishlistIds || [];
  const byId = catalogIndex(ctx.catalog);

  const recentProducts = recentIds
    .map((id) => byId.get(id))
    .filter((p): p is Product => !!p);
  const purchasedProducts = purchasedIds
    .map((id) => byId.get(id))
    .filter((p): p is Product => !!p);

  // Khám phá: loại đã xem / wishlist / đã mua — repurchase thêm lại sau
  const exploreExclude = excludeSet(
    ctx.excludeIds,
    recentIds,
    wishlistIds,
    purchasedIds
  );

  if (
    !recentProducts.length &&
    !purchasedProducts.length &&
    !wishlistIds.length
  ) {
    return recommendBestsellers(ctx, limit);
  }

  const seedForContent = [
    ...recentProducts.slice(0, 8),
    ...purchasedProducts.slice(0, 8),
  ];
  const content = scoreContentNeighbors(
    seedForContent,
    ctx.catalog,
    exploreExclude
  );

  const collabSeeds = [
    ...new Set([...purchasedIds.slice(0, 15), ...recentIds.slice(0, 8)]),
  ];
  const collab = scoreCollabNeighbors(
    ctx.matrix,
    collabSeeds,
    ctx.catalog,
    exploreExclude
  );

  const pop = scorePopularity(
    ctx.catalog,
    exploreExclude,
    ctx.recentSold
  ).slice(0, 50);

  // Boost wishlist neighbors via content from wishlist items
  const wishProducts = wishlistIds
    .map((id) => byId.get(id))
    .filter((p): p is Product => !!p);
  if (wishProducts.length) {
    const wishContent = scoreContentNeighbors(
      wishProducts,
      ctx.catalog,
      exploreExclude
    );
    for (const w of wishContent) {
      w.score *= 1.1;
      w.reason = "Gần với mục bạn đã thích";
      content.push(w);
    }
  }

  const hasCollab = collab.length > 0;
  let merged = mergeHybrid(content, collab, pop, {
    content: 0.4,
    collab: hasCollab ? 0.4 : 0.1,
    pop: 0.2,
  });

  // Repurchase soft: staples đã mua, còn hàng
  for (const id of purchasedIds.slice(0, 12)) {
    const p = byId.get(id);
    if (!p || !isRecommendable(p, excludeSet(ctx.excludeIds, recentIds))) {
      continue;
    }
    if (merged.some((m) => m.product.id === id)) continue;
    merged.push({
      product: p,
      score:
        0.35 +
        Math.min((p.soldCount || 0) / 200, 0.2) +
        (p.isPromotion ? 0.05 : 0),
      reason: "Bạn đã mua — mua lại?",
    });
  }

  merged.sort((a, b) => b.score - a.score);
  return finalize(merged, limit, hasCollab ? "hybrid" : "content", hasCollab);
}

/** Đã xem gần đây — resolve theo thứ tự */
export function recommendRecent(
  recentIds: string[],
  catalog: Product[],
  excludeId: string | undefined,
  limit = 4
): RecommendResult {
  const byId = catalogIndex(catalog);
  const products: Product[] = [];
  for (const id of recentIds) {
    if (id === excludeId) continue;
    const p = byId.get(id);
    if (p && p.status === "active") {
      products.push(p);
      if (products.length >= limit) break;
    }
  }
  return { products, source: "content" };
}

/** Client fallback helpers (giữ API cũ) */
export function getSimilarProducts(
  product: Product,
  products: Product[],
  limit = 4
): Product[] {
  return recommendSimilar(product, { catalog: products }, limit).products;
}

export function getFrequentlyBoughtTogether(
  product: Product,
  products: Product[],
  limit = 3
): Product[] {
  return recommendBoughtTogether(product, { catalog: products }, limit)
    .products;
}

export function getCartRecommendations(
  cartProducts: Product[],
  catalog: Product[],
  limit = 4
): Product[] {
  return recommendForCart(cartProducts, { catalog }, limit).products;
}

export function getBestsellers(products: Product[], limit = 4): Product[] {
  return recommendBestsellers({ catalog: products }, limit).products;
}

export function getPersonalizedRecommendations(
  products: Product[],
  limit = 4,
  recentIds: string[] = []
): Product[] {
  return recommendPersonalized({ recentIds }, { catalog: products }, limit)
    .products;
}

export function resolveRecentProducts(
  products: Product[],
  recentIds: string[],
  excludeId?: string,
  limit = 4
): Product[] {
  return recommendRecent(recentIds, products, excludeId, limit).products;
}

/** Debug / analytics: điểm CF thô */
export function debugCoScores(
  matrix: CoPurchaseMatrix,
  seedId: string,
  limit = 10
) {
  return topCoPurchased(matrix, seedId, limit).map((n) => ({
    ...n,
    ...coPurchaseScore(matrix, seedId, n.productId),
  }));
}
