import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth-server";
import { apiSuccess, apiError } from "@/lib/mappers";

const DAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function GET() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return apiError("Forbidden", 403);
  }

  const today = startOfDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 6);

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
        createdAt: { gte: weekStart, lt: tomorrow },
        status: { not: "cancelled" },
      },
    }),
  ]);

  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
  const yesterdayRevenue = yesterdayOrders.reduce((s, o) => s + o.total, 0);
  const revenueChange =
    yesterdayRevenue > 0
      ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 1000) / 10
      : todayRevenue > 0
        ? 100
        : 0;

  const todayOrderCount = todayOrders.length;
  const yesterdayOrderCount = yesterdayOrders.length;
  const ordersChange =
    yesterdayOrderCount > 0
      ? Math.round(((todayOrderCount - yesterdayOrderCount) / yesterdayOrderCount) * 1000) / 10
      : todayOrderCount > 0
        ? 100
        : 0;

  // 7 ngày gần nhất, nhãn đúng thứ trong tuần
  const revenueChart = [];
  const ordersChart = [];
  for (let offset = 6; offset >= 0; offset--) {
    const dayStart = new Date(today);
    dayStart.setDate(dayStart.getDate() - offset);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const label = DAY_LABELS[dayStart.getDay()];
    const dayOrders = weekOrders.filter(
      (o) => o.createdAt >= dayStart && o.createdAt < dayEnd
    );
    revenueChart.push({
      label,
      value: dayOrders.reduce((s, o) => s + o.total, 0),
    });
    ordersChart.push({
      label,
      value: dayOrders.length,
    });
  }

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
