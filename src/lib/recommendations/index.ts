export { CATEGORY_PAIRS, relatedCategories } from "./categories";
export { trackRecentlyViewed, getRecentIds } from "./recent";
export { searchProductsByKeyword } from "./search";
export {
  getSimilarProducts,
  getFrequentlyBoughtTogether,
  getCartRecommendations,
  getBestsellers,
  getPersonalizedRecommendations,
  resolveRecentProducts,
  recommendSimilar,
  recommendBoughtTogether,
  recommendBestsellers,
  recommendForCart,
  recommendPersonalized,
  recommendRecent,
} from "./engine";
export type { RecommendResult, PersonalizedInput, EngineContext } from "./engine";
export {
  getCoPurchaseMatrix,
  getRecentSoldMap,
  getUserPurchaseHistory,
  getUserWishlistIds,
  invalidateCoPurchaseCache,
} from "./copurchase";

import type { Product } from "@/types";
import { getRecentIds } from "./recent";
import { resolveRecentProducts } from "./engine";

/** Client helper — đọc localStorage */
export function getRecentlyViewed(
  products: Product[],
  excludeId?: string
): Product[] {
  return resolveRecentProducts(products, getRecentIds(), excludeId, 4);
}