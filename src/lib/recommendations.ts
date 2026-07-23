import { Product } from "@/types";

const CATEGORY_PAIRS: Record<string, string[]> = {
  "rau-cu": ["gia-vi", "trai-cay", "sua"],
  "trai-cay": ["sua", "banh-keo", "rau-cu"],
  "do-uong": ["banh-keo", "mi-goi", "dong-lanh"],
  "gia-vi": ["rau-cu", "mi-goi", "dong-lanh"],
  "banh-keo": ["do-uong", "sua", "mi-goi"],
  "dong-lanh": ["gia-vi", "mi-goi", "do-uong"],
  "mi-goi": ["do-uong", "dong-lanh", "gia-vi"],
  "sua": ["banh-keo", "trai-cay", "mi-goi"],
};

const RECENTLY_VIEWED_KEY = "taphoa_recently_viewed";
const MAX_RECENT = 8;

export function trackRecentlyViewed(productId: string): void {
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
    const ids: string[] = stored ? JSON.parse(stored) : [];
    const updated = [productId, ...ids.filter((id) => id !== productId)].slice(0, MAX_RECENT);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch {
    /* ignore */
  }
}

export function getRecentlyViewed(products: Product[], excludeId?: string): Product[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (!stored) return [];
    const ids: string[] = JSON.parse(stored);
    return ids
      .filter((id) => id !== excludeId)
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => !!p)
      .slice(0, 4);
  } catch {
    return [];
  }
}

function similarityScore(base: Product, candidate: Product): number {
  let score = 0;
  if (base.categorySlug === candidate.categorySlug) score += 40;
  if (base.brand === candidate.brand) score += 15;
  const priceDiff = Math.abs(base.price - candidate.price) / Math.max(base.price, 1);
  if (priceDiff <= 0.3) score += 20;
  else if (priceDiff <= 0.5) score += 10;
  score += candidate.rating * 2;
  if (candidate.isFeatured) score += 5;
  if (candidate.isPromotion) score += 5;
  const relatedCategories = CATEGORY_PAIRS[base.categorySlug] || [];
  if (relatedCategories.includes(candidate.categorySlug)) score += 25;
  return score;
}

export function getSimilarProducts(product: Product, products: Product[], limit = 4): Product[] {
  return products
    .filter((p) => p.id !== product.id && p.status === "active")
    .map((p) => ({ product: p, score: similarityScore(product, p) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ product: p }) => p);
}

export function getFrequentlyBoughtTogether(
  product: Product,
  products: Product[],
  limit = 3
): Product[] {
  const related = CATEGORY_PAIRS[product.categorySlug] || [];
  const sameCategory = products.filter(
    (p) => p.id !== product.id && p.categorySlug === product.categorySlug && p.status === "active"
  );
  const crossCategory = products.filter(
    (p) =>
      p.id !== product.id &&
      related.includes(p.categorySlug) &&
      p.status === "active"
  );
  const combined = [...crossCategory, ...sameCategory].sort(
    (a, b) => b.rating * b.reviewCount - a.rating * a.reviewCount
  );
  const seen = new Set<string>();
  const result: Product[] = [];
  for (const p of combined) {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      result.push(p);
      if (result.length >= limit) break;
    }
  }
  return result;
}

export function getPersonalizedRecommendations(products: Product[], limit = 4): Product[] {
  const recent = getRecentlyViewed(products);
  if (recent.length === 0) {
    return products
      .filter((p) => p.isFeatured && p.status === "active")
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }
  const categoryCount: Record<string, number> = {};
  recent.forEach((p) => {
    categoryCount[p.categorySlug] = (categoryCount[p.categorySlug] || 0) + 1;
  });
  const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0];
  const viewedIds = new Set(recent.map((p) => p.id));
  return products
    .filter((p) => !viewedIds.has(p.id) && p.status === "active")
    .map((p) => {
      let score = similarityScore(recent[0], p);
      if (p.categorySlug === topCategory) score += 20;
      return { product: p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ product: p }) => p);
}

export function searchProductsByKeyword(
  keyword: string,
  products: Product[],
  limit = 3
): Product[] {
  const q = keyword.toLowerCase().trim();
  if (!q) return [];
  return products
    .filter(
      (p) =>
        p.status === "active" &&
        (p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.categorySlug.replace(/-/g, " ").includes(q))
    )
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
}
