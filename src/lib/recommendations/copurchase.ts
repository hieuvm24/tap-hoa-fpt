/**
 * Item–item co-purchase matrix từ đơn hàng thật.
 * Cache in-memory (TTL) — phù hợp serverless nhẹ / Node lâu dài.
 */

import { prisma } from "@/lib/db";

export type CoPurchaseMatrix = {
  /** pairCount[a][b] = số đơn có cả a và b */
  pairs: Map<string, Map<string, number>>;
  /** số đơn chứa sản phẩm */
  support: Map<string, number>;
  /** số đơn multi-item dùng để build */
  orderCount: number;
  builtAt: number;
};

const TTL_MS = 10 * 60 * 1000; // 10 phút
const LOOKBACK_DAYS = 180;
const MAX_ORDERS = 800;

let cache: CoPurchaseMatrix | null = null;
let building: Promise<CoPurchaseMatrix> | null = null;

export function invalidateCoPurchaseCache() {
  cache = null;
}

async function buildMatrix(): Promise<CoPurchaseMatrix> {
  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const orders = await prisma.order.findMany({
    where: {
      status: { not: "cancelled" },
      createdAt: { gte: since },
    },
    select: {
      id: true,
      items: { select: { productId: true } },
    },
    orderBy: { createdAt: "desc" },
    take: MAX_ORDERS,
  });

  const pairs = new Map<string, Map<string, number>>();
  const support = new Map<string, number>();
  let multi = 0;

  const bumpPair = (a: string, b: string) => {
    if (a === b) return;
    if (!pairs.has(a)) pairs.set(a, new Map());
    const row = pairs.get(a)!;
    row.set(b, (row.get(b) || 0) + 1);
  };

  for (const order of orders) {
    const ids = [...new Set(order.items.map((i) => i.productId))];
    if (ids.length < 2) {
      // Vẫn cộng support cho đơn 1 SP (dùng confidence ổn định hơn)
      for (const id of ids) {
        support.set(id, (support.get(id) || 0) + 1);
      }
      continue;
    }
    multi += 1;
    for (const id of ids) {
      support.set(id, (support.get(id) || 0) + 1);
    }
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        bumpPair(ids[i], ids[j]);
        bumpPair(ids[j], ids[i]);
      }
    }
  }

  return {
    pairs,
    support,
    orderCount: multi,
    builtAt: Date.now(),
  };
}

export async function getCoPurchaseMatrix(): Promise<CoPurchaseMatrix> {
  if (cache && Date.now() - cache.builtAt < TTL_MS) return cache;
  if (building) return building;
  building = buildMatrix()
    .then((m) => {
      cache = m;
      building = null;
      return m;
    })
    .catch((e) => {
      building = null;
      throw e;
    });
  return building;
}

/**
 * Điểm CF cho ứng viên B khi neo ở A.
 * Dùng confidence + lift nhẹ — ổn định hơn raw count khi catalog lệch.
 */
export function coPurchaseScore(
  matrix: CoPurchaseMatrix,
  seedId: string,
  candidateId: string
): { score: number; coCount: number; confidence: number; lift: number } {
  const coCount = matrix.pairs.get(seedId)?.get(candidateId) || 0;
  if (coCount <= 0) {
    return { score: 0, coCount: 0, confidence: 0, lift: 0 };
  }
  const supportA = matrix.support.get(seedId) || 1;
  const supportB = matrix.support.get(candidateId) || 1;
  const n = Math.max(matrix.orderCount, 1);
  const confidence = coCount / supportA;
  const lift = (coCount * n) / (supportA * supportB);
  // Score thực dụng: ưu tiên co-occurrence + lift có trần
  const score =
    coCount * 4 +
    confidence * 40 +
    Math.min(lift, 8) * 6 +
    Math.log1p(supportB) * 2;
  return { score, coCount, confidence, lift };
}

/** Top neighbors của một seed theo CF thuần */
export function topCoPurchased(
  matrix: CoPurchaseMatrix,
  seedId: string,
  limit = 20
): { productId: string; score: number; coCount: number }[] {
  const row = matrix.pairs.get(seedId);
  if (!row?.size) return [];
  const scored: { productId: string; score: number; coCount: number }[] = [];
  for (const [productId, coCount] of row) {
    const { score } = coPurchaseScore(matrix, seedId, productId);
    scored.push({ productId, score, coCount });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Gộp điểm CF từ nhiều seed (giỏ / lịch sử mua) */
export function aggregateCoPurchase(
  matrix: CoPurchaseMatrix,
  seedIds: string[],
  exclude: Set<string>
): Map<string, { score: number; coCount: number; fromSeeds: number }> {
  const agg = new Map<
    string,
    { score: number; coCount: number; fromSeeds: number }
  >();
  for (const seed of seedIds) {
    const neighbors = topCoPurchased(matrix, seed, 30);
    for (const n of neighbors) {
      if (exclude.has(n.productId)) continue;
      const prev = agg.get(n.productId) || {
        score: 0,
        coCount: 0,
        fromSeeds: 0,
      };
      prev.score += n.score;
      prev.coCount += n.coCount;
      prev.fromSeeds += 1;
      agg.set(n.productId, prev);
    }
  }
  // Bonus nếu nhiều seed cùng “vote”
  for (const [id, v] of agg) {
    if (v.fromSeeds > 1) v.score *= 1 + 0.15 * (v.fromSeeds - 1);
    agg.set(id, v);
  }
  return agg;
}

/** Doanh số gần đây (trending) — map productId → số lượng bán */
export async function getRecentSoldMap(
  days = 14
): Promise<Map<string, number>> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      order: {
        status: { not: "cancelled" },
        createdAt: { gte: since },
      },
    },
    _sum: { quantity: true },
  });
  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(r.productId, r._sum.quantity || 0);
  }
  return map;
}

/** Lịch sử mua của user (productId mới nhất trước) */
export async function getUserPurchaseHistory(
  userId: string,
  limit = 40
): Promise<string[]> {
  const items = await prisma.orderItem.findMany({
    where: {
      order: {
        userId,
        status: { not: "cancelled" },
      },
    },
    select: { productId: true, order: { select: { createdAt: true } } },
    orderBy: { order: { createdAt: "desc" } },
    take: limit * 2,
  });
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const it of items) {
    if (seen.has(it.productId)) continue;
    seen.add(it.productId);
    ids.push(it.productId);
    if (ids.length >= limit) break;
  }
  return ids;
}

export async function getUserWishlistIds(userId: string): Promise<string[]> {
  const rows = await prisma.wishlistItem.findMany({
    where: { userId },
    select: { productId: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return rows.map((r) => r.productId);
}
