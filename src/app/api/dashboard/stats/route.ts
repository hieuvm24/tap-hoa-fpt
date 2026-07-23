import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth-server";
import { apiSuccess, apiError } from "@/lib/mappers";

export async function GET() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return apiError("Forbidden", 403);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const [
    todayOrders,
    yesterdayOrders,
    totalOrders,
    totalProducts,
    totalCustomers,
    weekOrders,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: today, lt: tomorrow }, status: { not: "cancelled" } },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: yesterday, lt: today }, status: { not: "cancelled" } },
    }),
    prisma.order.count({ where: { status: { not: "cancelled" } } }),
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.order.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        status: { not: "cancelled" },
      },
    }),
  ]);

  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
  const yesterdayRevenue = yesterdayOrders.reduce((s, o) => s + o.total, 0);
  const revenueChange =
    yesterdayRevenue > 0
      ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 1000) / 10
      : 0;

  const todayOrderCount = todayOrders.length;
  const yesterdayOrderCount = yesterdayOrders.length;
  const ordersChange =
    yesterdayOrderCount > 0
      ? Math.round(((todayOrderCount - yesterdayOrderCount) / yesterdayOrderCount) * 1000) / 10
      : 0;

  const dayLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const revenueChart = dayLabels.map((label, i) => {
    const dayStart = new Date();
    dayStart.setDate(dayStart.getDate() - (6 - i));
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const dayOrders = weekOrders.filter(
      (o) => o.createdAt >= dayStart && o.createdAt < dayEnd
    );
    return {
      label,
      value: dayOrders.reduce((s, o) => s + o.total, 0),
    };
  });

  const ordersChart = dayLabels.map((label, i) => {
    const dayStart = new Date();
    dayStart.setDate(dayStart.getDate() - (6 - i));
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    return {
      label,
      value: weekOrders.filter((o) => o.createdAt >= dayStart && o.createdAt < dayEnd).length,
    };
  });

  return apiSuccess({
    stats: {
      todayRevenue,
      totalOrders,
      totalProducts,
      totalCustomers,
      revenueChange,
      ordersChange,
    },
    revenueChart,
    ordersChart,
  });
}
