import type { Product } from "@/types";
import { relatedCategories } from "./categories";

export type ScoredProduct = {
  product: Product;
  score: number;
  reason?: string;
};

export function isRecommendable(p: Product, exclude: Set<string>): boolean {
  return (
    !exclude.has(p.id) &&
    p.status === "active" &&
    p.stock > 0
  );
}

/** Điểm nội dung: danh mục, brand, giá, rating, promo */
export function contentSimilarity(base: Product, candidate: Product): number {
  let score = 0;
  if (base.categorySlug === candidate.categorySlug) score += 42;
  else if (relatedCategories(base.categorySlug).includes(candidate.categorySlug)) {
    score += 26;
  }
  if (base.brand && candidate.brand && base.brand === candidate.brand) score += 16;

  const priceDiff =
    Math.abs(base.price - candidate.price) / Math.max(base.price, 1);
  if (priceDiff <= 0.25) score += 18;
  else if (priceDiff <= 0.45) score += 10;
  else if (priceDiff <= 0.7) score += 4;

  // Tên chung token (rất nhẹ — tránh overfit)
  const baseTokens = tokenize(base.name);
  const candTokens = tokenize(candidate.name);
  let overlap = 0;
  for (const t of baseTokens) {
    if (candTokens.has(t)) overlap += 1;
  }
  score += Math.min(overlap * 4, 12);

  return score;
}

function tokenize(name: string): Set<string> {
  return new Set(
    name
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3)
  );
}

/** Phổ biến / chất lượng — dùng làm prior khi cold-start */
export function popularityScore(
  p: Product,
  recentSold?: Map<string, number>
): number {
  const recent = recentSold?.get(p.id) || 0;
  let score =
    Math.min(p.soldCount || 0, 200) * 0.35 +
    recent * 2.8 +
    (p.rating || 0) * 3.2 +
    Math.min(p.reviewCount || 0, 40) * 0.15;
  if (p.isFeatured) score += 8;
  if (p.isPromotion) score += 6;
  // Soft boost còn hàng nhưng không ưu tiên tồn quá lớn
  if (p.stock > 0 && p.stock <= 5) score += 2; // sắp hết → urgency nhẹ
  return score;
}

/** Chuẩn hóa điểm về [0, 1] trong batch */
export function normalizeScores(items: ScoredProduct[]): ScoredProduct[] {
  if (!items.length) return items;
  const max = Math.max(...items.map((i) => i.score));
  const min = Math.min(...items.map((i) => i.score));
  const span = max - min || 1;
  return items.map((i) => ({
    ...i,
    score: (i.score - min) / span,
  }));
}

/**
 * MMR-lite: đa dạng danh mục — tránh 4 SP cùng 1 kệ.
 * lambda cao → ưu tiên relevance; thấp → ưu tiên đa dạng.
 */
export function diversify(
  scored: ScoredProduct[],
  limit: number,
  lambda = 0.72
): ScoredProduct[] {
  if (scored.length <= limit) return scored.slice(0, limit);

  const remaining = [...scored].sort((a, b) => b.score - a.score);
  const selected: ScoredProduct[] = [];

  while (selected.length < limit && remaining.length) {
    let bestIdx = 0;
    let bestVal = -Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const cand = remaining[i];
      const redundancy = selected.length
        ? Math.max(
            ...selected.map((s) => categoryOverlap(s.product, cand.product))
          )
        : 0;
      const val = lambda * cand.score - (1 - lambda) * redundancy;
      if (val > bestVal) {
        bestVal = val;
        bestIdx = i;
      }
    }
    selected.push(remaining[bestIdx]);
    remaining.splice(bestIdx, 1);
  }
  return selected;
}

function categoryOverlap(a: Product, b: Product): number {
  if (a.categorySlug === b.categorySlug) return 1;
  if (relatedCategories(a.categorySlug).includes(b.categorySlug)) return 0.45;
  if (a.brand && b.brand && a.brand === b.brand) return 0.25;
  return 0;
}

export function toProducts(scored: ScoredProduct[]): Product[] {
  return scored.map((s) => s.product);
}

export function reasonsMap(
  scored: ScoredProduct[]
): Record<string, string> | undefined {
  const map: Record<string, string> = {};
  let any = false;
  for (const s of scored) {
    if (s.reason) {
      map[s.product.id] = s.reason;
      any = true;
    }
  }
  return any ? map : undefined;
}
