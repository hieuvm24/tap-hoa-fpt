import type { Product } from "@/types";
import { normalizeVi } from "@/lib/normalize-vi";

export function searchProductsByKeyword(
  keyword: string,
  products: Product[],
  limit = 3
): Product[] {
  const q = normalizeVi(keyword);
  if (!q) return [];
  return products
    .filter((p) => {
      if (p.status !== "active") return false;
      const hay = normalizeVi(
        `${p.name} ${p.category} ${p.brand} ${p.categorySlug.replace(/-/g, " ")}`
      );
      return hay.includes(q);
    })
    .sort(
      (a, b) =>
        (b.soldCount || 0) - (a.soldCount || 0) || b.rating - a.rating
    )
    .slice(0, limit);
}
