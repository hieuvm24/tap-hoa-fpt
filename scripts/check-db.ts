import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [products, customers, orders] = await Promise.all([
    prisma.product.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.order.count(),
  ]);
  console.log({ products, customers, orders, ok: true });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
