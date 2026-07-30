import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth-server";
import { apiSuccess, apiError } from "@/lib/mappers";

const DAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function pctChange(current: number, previous: number) {
  if (previous > 0) {
    return Math.round(((current - previous) / previous) * 1000) / 10;
  }
  return current > 0 ? 100 : 0;
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

  const monthStart = startOfDay(new Date(today.getFullYear(), today.getMonth(), 1));

  const [
    todayOrders,
    yesterdayOrders,
    monthOrders,
    weekOrders,
    actionOrders,
    lowStockProducts,
    outOfStockCount,
    unpaidCodOrders,
    pendingCount,
    shippingCount,
    toConfirmCount,
  ] = await Promise.all([
    prisma.order.findMany({
      where: {
        createdAt: { gte: today, lt: tomorrow },
        status: { not: "cancelled" },
      },
      select: {
        total: true,
        fulfillmentType: true,
      },
    }),
    prisma.order.findMany({
      where: {
        createdAt: { gte: yesterday, lt: today },
        status: { not: "cancelled" },
      },
      select: { total: true },
    }),
    prisma.order.findMany({
      where: {
        createdAt: { gte: monthStart, lt: tomorrow },
        status: { not: "cancelled" },
      },
      select: { total: true },
    }),
    prisma.order.findMany({
      where: {
        createdAt: { gte: weekStart, lt: tomorrow },
        status: { not: "cancelled" },
      },
      select: { id: true, total: true, createdAt: true },
    }),
    prisma.order.findMany({
      where: {
        status: { in: ["pending", "confirmed", "shipping"] },
      },
      orderBy: { createdAt: "asc" },
      take: 8,
      select: {
        id: true,
        orderCode: true,
        customerName: true,
        total: true,
        status: true,
        fulfillmentType: true,
        paymentMethod: true,
        paymentStatus: true,
        createdAt: true,
      },
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE", stock: { gt: 0, lte: 10 } },
      select: { name: true, stock: true, sku: true },
      orderBy: { stock: "asc" },
      take: 8,
    }),
    prisma.product.count({
      where: { status: "ACTIVE", stock: { lte: 0 } },
    }),
    prisma.order.findMany({
      where: {
        status: { not: "cancelled" },
        paymentMethod: "cod",
        paymentStatus: { not: "paid" },
      },
      select: { total: true },
    }),
    prisma.order.count({ where: { status: "pending" } }),
    prisma.order.count({ where: { status: "shipping" } }),
    prisma.order.count({
      where: { status: { in: ["pending", "confirmed"] } },
    }),
  ]);

  const weekItems =
    weekOrders.length === 0
      ? []
      : await prisma.orderItem.findMany({
          where: { orderId: { in: weekOrders.map((o) => o.id) } },
          select: { productName: true, quantity: true },
        });

  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
  const yesterdayRevenue = yesterdayOrders.reduce((s, o) => s + o.total, 0);
  const monthRevenue = monthOrders.reduce((s, o) => s + o.total, 0);

  const todayPickup = todayOrders.filter((o) => o.fulfillmentType === "pickup").length;
  const todayDelivery = todayOrders.length - todayPickup;

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

  const productQty = new Map<string, number>();
  for (const it of weekItems) {
    productQty.set(it.productName, (productQty.get(it.productName) || 0) + it.quantity);
  }
  const topWeekProducts = [...productQty.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({
      label: name.length > 28 ? name.slice(0, 28) + "…" : name,
      value,
    }));

  return apiSuccess({
    stats: {
      todayRevenue,
      todayOrders: todayOrders.length,
      revenueChange: pctChange(todayRevenue, yesterdayRevenue),
      ordersChange: pctChange(todayOrders.length, yesterdayOrders.length),
      monthRevenue,
      monthOrders: monthOrders.length,
      pendingCount,
      toConfirmCount,
      shippingCount,
      lowStockCount: lowStockProducts.length,
      outOfStockCount,
      todayPickup,
      todayDelivery,
      unpaidCodTotal: unpaidCodOrders.reduce((s, o) => s + o.total, 0),
      unpaidCodCount: unpaidCodOrders.length,
    },
    revenueChart,
    ordersChart,
    actionOrders: actionOrders.map((o) => ({
      id: o.id,
      orderCode: o.orderCode,
      customerName: o.customerName,
      total: o.total,
      status: o.status,
      fulfillmentType: o.fulfillmentType,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt.toISOString(),
    })),
    lowStockItems: lowStockProducts.map((p) => ({
      label: p.name.length > 28 ? p.name.slice(0, 28) + "…" : p.name,
      value: p.stock,
      sku: p.sku,
    })),
    topWeekProducts,
  });
}
