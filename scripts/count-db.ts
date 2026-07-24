import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [products, customers, orders, orders30, reviews] = await Promise.all([
    prisma.product.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.order.count(),
    prisma.order.count({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
    }),
    prisma.review.count(),
  ]);
  console.log(JSON.stringify({ products, customers, orders, orders30, reviews }, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
