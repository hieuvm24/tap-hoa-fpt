import type { Prisma, PrismaClient } from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

/** Đồng bộ rating & reviewCount của sản phẩm từ bảng Review thật */
export async function syncProductRating(db: DbClient, productId: string) {
  const agg = await db.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { id: true },
  });

  const count = agg._count.id;
  const rating =
    count === 0 ? 0 : Math.round((agg._avg.rating ?? 0) * 10) / 10;

  await db.product.update({
    where: { id: productId },
    data: { rating, reviewCount: count },
  });

  return { rating, reviewCount: count };
}

/** Đồng bộ rating cho toàn bộ sản phẩm */
export async function syncAllProductRatings(db: PrismaClient) {
  const products = await db.product.findMany({ select: { id: true } });
  for (const p of products) {
    await syncProductRating(db, p.id);
  }
}
