import { Product } from "@/types";

/** Danh mục thường mua kèm nhau (tạp hóa / siêu thị mini) */
export const CATEGORY_PAIRS: Record<string, string[]> = {
  "rau-cu": ["gia-vi", "trai-cay", "sua", "dong-lanh"],
  "trai-cay": ["sua", "banh-keo", "rau-cu"],
  "do-uong": ["banh-keo", "mi-goi", "dong-lanh"],
  "gia-vi": ["rau-cu", "mi-goi", "dong-lanh"],
  "banh-keo": ["do-uong", "sua", "mi-goi"],
  "dong-lanh": ["gia-vi", "mi-goi", "do-uong", "rau-cu"],
  "mi-goi": ["do-uong", "dong-lanh", "gia-vi"],
  sua: ["banh-keo", "trai-cay", "mi-goi"],
  "do-gia-dung": ["cham-soc-ca-nhan", "gia-vi"],
  "cham-soc-ca-nhan": ["do-gia-dung", "sua"],
};

const RECENTLY_VIEWED_KEY = "taphoa_recently_viewed";
const MAX_RECENT = 12;

export function trackRecentlyViewed(productId: string): void {
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
    const ids: string[] = stored ? JSON.parse(stored) : [];
    const updated = [productId, ...ids.filter((id) => id !== productId)].slice(
      0,
      MAX_RECENT
    );
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch {
    /* ignore */
  }
}

export function getRecentIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (!stored) return [];
    return (JSON.parse(stored) as string[]).filter(Boolean);
  } catch {
    return [];
  }
}

export function getRecentlyViewed(
  products: Product[],
  excludeId?: string
): Product[] {
  const ids = getRecentIds().filter((id) => id !== excludeId);
  return ids
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => !!p)
    .slice(0, 4);
}

function similarityScore(base: Product, candidate: Product): number {
  let score = 0;
  if (base.categorySlug === candidate.categorySlug) score += 40;
  if (base.brand === candidate.brand) score += 15;
  const priceDiff =
    Math.abs(base.price - candidate.price) / Math.max(base.price, 1);
  if (priceDiff <= 0.3) score += 20;
  else if (priceDiff <= 0.5) score += 10;
  score += candidate.rating * 2;
  score += Math.min(candidate.soldCount || 0, 50) * 0.2;
  if (candidate.isFeatured) score += 5;
  if (candidate.isPromotion) score += 5;
  const relatedCategories = CATEGORY_PAIRS[base.categorySlug] || [];
  if (relatedCategories.includes(candidate.categorySlug)) score += 25;
  return score;
}

export function getSimilarProducts(
  product: Product,
  products: Product[],
  limit = 4
): Product[] {
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
    (p) =>
      p.id !== product.id &&
      p.categorySlug === product.categorySlug &&
      p.status === "active"
  );
  const crossCategory = products.filter(
    (p) =>
      p.id !== product.id &&
      related.includes(p.categorySlug) &&
      p.status === "active"
  );
  const combined = [...crossCategory, ...sameCategory].sort((a, b) => {
    const sa = (a.soldCount || 0) * 2 + a.rating * a.reviewCount;
    const sb = (b.soldCount || 0) * 2 + b.rating * b.reviewCount;
    return sb - sa;
  });
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

/** Gợi ý theo giỏ hàng hiện tại */
export function getCartRecommendations(
  cartProducts: Product[],
  catalog: Product[],
  limit = 4
): Product[] {
  if (!cartProducts.length) {
    return getBestsellers(catalog, limit);
  }
  const inCart = new Set(cartProducts.map((p) => p.id));
  const categoryBoost: Record<string, number> = {};
  for (const p of cartProducts) {
    categoryBoost[p.categorySlug] = (categoryBoost[p.categorySlug] || 0) + 3;
    for (const rel of CATEGORY_PAIRS[p.categorySlug] || []) {
      categoryBoost[rel] = (categoryBoost[rel] || 0) + 2;
    }
  }

  return catalog
    .filter((p) => !inCart.has(p.id) && p.status === "active" && p.stock > 0)
    .map((p) => {
      let score = (categoryBoost[p.categorySlug] || 0) * 10;
      score += (p.soldCount || 0) * 0.3;
      score += p.rating * 2;
      if (p.isPromotion) score += 8;
      if (p.isFeatured) score += 5;
      // Ưu tiên mức giá gần với trung bình giỏ
      const avg =
        cartProducts.reduce((s, c) => s + c.price, 0) / cartProducts.length;
      const diff = Math.abs(p.price - avg) / Math.max(avg, 1);
      if (diff <= 0.4) score += 10;
      return { product: p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ product }) => product);
}

export function getBestsellers(products: Product[], limit = 4): Product[] {
  return products
    .filter((p) => p.status === "active" && p.stock > 0)
    .sort((a, b) => {
      const sa = (a.soldCount || 0) * 3 + a.rating * 2 + (a.isFeatured ? 10 : 0);
      const sb = (b.soldCount || 0) * 3 + b.rating * 2 + (b.isFeatured ? 10 : 0);
      return sb - sa;
    })
    .slice(0, limit);
}

export function getPersonalizedRecommendations(
  products: Product[],
  limit = 4
): Product[] {
  const recent = getRecentlyViewed(products);
  if (recent.length === 0) {
    return getBestsellers(products, limit);
  }
  const categoryCount: Record<string, number> = {};
  recent.forEach((p) => {
    categoryCount[p.categorySlug] = (categoryCount[p.categorySlug] || 0) + 1;
  });
  const topCategory = Object.entries(categoryCount).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0];
  const viewedIds = new Set(recent.map((p) => p.id));
  return products
    .filter((p) => !viewedIds.has(p.id) && p.status === "active")
    .map((p) => {
      let score = similarityScore(recent[0], p);
      if (p.categorySlug === topCategory) score += 20;
      score += Math.min(p.soldCount || 0, 40) * 0.15;
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
    .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0) || b.rating - a.rating)
    .slice(0, limit);
}
