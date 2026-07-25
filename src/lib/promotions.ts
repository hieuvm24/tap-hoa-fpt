/** Tính giảm giá từ chương trình khuyến mãi (theo danh mục) */

export type PromoRule = {
  title: string;
  discount: number;
  ruleType: string;
  categorySlug: string | null;
};

export type PromoLine = {
  categorySlug: string;
  price: number;
  quantity: number;
};

/** Mua 2 tặng 1: mỗi 3 đơn vị thì 1 đơn vị rẻ nhất được miễn */
function bogoDiscount(lines: { price: number; quantity: number }[]): number {
  const units: number[] = [];
  for (const line of lines) {
    for (let i = 0; i < line.quantity; i++) units.push(line.price);
  }
  if (units.length < 3) return 0;
  units.sort((a, b) => a - b);
  const free = Math.floor(units.length / 3);
  return units.slice(0, free).reduce((s, p) => s + p, 0);
}

export function calcPromotionDiscount(
  promos: PromoRule[],
  lines: PromoLine[]
): { amount: number; labels: string[] } {
  let amount = 0;
  const labels: string[] = [];
  const usedCategories = new Set<string>();

  for (const promo of promos) {
    if (!promo.categorySlug) continue;
    if (promo.ruleType === "banner") continue;
    if (usedCategories.has(promo.categorySlug)) continue;

    const catLines = lines.filter((l) => l.categorySlug === promo.categorySlug);
    if (!catLines.length) continue;

    let d = 0;
    if (promo.ruleType === "percent" && promo.discount > 0) {
      const sub = catLines.reduce((s, l) => s + l.price * l.quantity, 0);
      d = Math.round(sub * (promo.discount / 100));
    } else if (promo.ruleType === "bogo") {
      d = bogoDiscount(catLines);
    }

    if (d > 0) {
      amount += d;
      labels.push(promo.title);
      usedCategories.add(promo.categorySlug);
    }
  }

  return { amount, labels };
}
