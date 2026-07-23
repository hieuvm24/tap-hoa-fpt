import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth-server";
import { apiSuccess, apiError } from "@/lib/mappers";

export async function GET() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return apiError("Forbidden", 403);
  }

  const monthLabels = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
  const currentYear = new Date().getFullYear();

  const monthlyRevenue = await Promise.all(
    monthLabels.map(async (label, i) => {
      const start = new Date(currentYear, i, 1);
      const end = new Date(currentYear, i + 1, 1);
      const orders = await prisma.order.findMany({
        where: { createdAt: { gte: start, lt: end }, status: { not: "cancelled" } },
      });
      return { label, value: orders.reduce((s, o) => s + o.total, 0) };
    })
  );

  const topProductsRaw = await prisma.orderItem.groupBy({
    by: ["productName"],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 5,
  });

  const topProducts = topProductsRaw.map((p) => ({
    label: p.productName.length > 20 ? p.productName.slice(0, 20) + "..." : p.productName,
    value: p._sum.quantity || 0,
  }));

  const customers = await prisma.user.findMany({ where: { role: "CUSTOMER" } });
  const topCustomersData = await Promise.all(
    customers.map(async (u) => {
      const orders = await prisma.order.findMany({
        where: { userId: u.id, status: { not: "cancelled" } },
      });
      return { label: u.name, value: orders.reduce((s, o) => s + o.total, 0) };
    })
  );
  topCustomersData.sort((a, b) => b.value - a.value);

  return apiSuccess({
    monthlyRevenue,
    topProducts,
    topCustomers: topCustomersData.slice(0, 5),
  });
}
