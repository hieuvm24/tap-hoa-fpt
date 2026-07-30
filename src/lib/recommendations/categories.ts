/** Danh mục thường mua kèm nhau (domain tạp hóa / mini-mart VN) */
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

export function relatedCategories(slug: string): string[] {
  return CATEGORY_PAIRS[slug] || [];
}
