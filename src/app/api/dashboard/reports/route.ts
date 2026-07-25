import { prisma } from "@/lib/db";
import { getSession, isOwnerRole } from "@/lib/auth-server";
import { apiSuccess, apiError } from "@/lib/mappers";

export async function GET() {
  const session = await getSession();
  if (!session || !isOwnerRole(session.role)) {
    return apiError("Chỉ chủ cửa hàng xem báo cáo", 403);
  }

  const monthLabels = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
  const currentYear = new Date().getFullYear();
  const now = new Date();

  // Chỉ hiện đến tháng hiện tại cho dễ đọc
  const monthsToShow = now.getMonth() + 1;

  const yearStart = new Date(currentYear, 0, 1);
  const yearOrders = await prisma.order.findMany({
    where: {
      createdAt: { gte: yearStart, lt: now },
      status: { not: "cancelled" },
    },
    select: { total: true, createdAt: true, userId: true, customerName: true },
  });

  const monthlyRevenue = monthLabels.slice(0, monthsToShow).map((label, i) => {
    const value = yearOrders
      .filter((o) => o.createdAt.getMonth() === i)
      .reduce((s, o) => s + o.total, 0);
    return { label, value };
  });

  const topProductsRaw = await prisma.orderItem.groupBy({
    by: ["productName"],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 8,
  });

  const topProducts = topProductsRaw.map((p) => ({
    label: p.productName.length > 28 ? p.productName.slice(0, 28) + "…" : p.productName,
    value: p._sum.quantity || 0,
  }));

  // Top khách theo tổng chi tiêu (chỉ khách có đơn)
  const spendByUser = new Map<string, { label: string; value: number }>();
  for (const o of yearOrders) {
    if (!o.userId) continue;
    const prev = spendByUser.get(o.userId);
    if (prev) prev.value += o.total;
    else spendByUser.set(o.userId, { label: o.customerName, value: o.total });
  }
  const topCustomers = [...spendByUser.values()]
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return apiSuccess({
    monthlyRevenue,
    topProducts,
    topCustomers,
  });
}
