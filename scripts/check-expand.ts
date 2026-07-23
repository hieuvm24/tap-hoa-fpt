import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [products, customers, orders, orderItems, sampleOrders, sampleProducts] =
    await Promise.all([
      prisma.product.count(),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.order.count(),
      prisma.orderItem.count(),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          orderCode: true,
          customerName: true,
          total: true,
          status: true,
          _count: { select: { items: true } },
        },
      }),
      prisma.product.findMany({
        where: { sku: { startsWith: "TC1" } },
        take: 5,
        select: { name: true, image: true, sku: true },
      }),
    ]);

  const ordersPerUser = await prisma.order.groupBy({
    by: ["userId"],
    _count: { id: true },
    where: { userId: { not: null } },
  });
  const withHistory = ordersPerUser.filter((o) => o._count.id > 0).length;

  console.log(
    JSON.stringify(
      {
        products,
        customers,
        orders,
        orderItems,
        customersWithOrders: withHistory,
        sampleOrders,
        sampleProducts,
      },
      null,
      2
    )
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
