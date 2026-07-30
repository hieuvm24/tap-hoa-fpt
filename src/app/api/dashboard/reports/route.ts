import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isOwnerRole } from "@/lib/auth-server";
import { apiSuccess, apiError } from "@/lib/mappers";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function pctChange(current: number, previous: number) {
  if (previous > 0) {
    return Math.round(((current - previous) / previous) * 1000) / 10;
  }
  return current > 0 ? 100 : 0;
}

function parseRange(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const now = new Date();
  const preset = searchParams.get("preset") || "month";
  let from: Date;
  let to: Date = endOfDay(now);

  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  if (fromParam && toParam) {
    from = startOfDay(new Date(fromParam));
    to = endOfDay(new Date(toParam));
  } else if (preset === "7d") {
    from = startOfDay(new Date(now.getTime() - 6 * 86400000));
  } else if (preset === "30d") {
    from = startOfDay(new Date(now.getTime() - 29 * 86400000));
  } else if (preset === "year") {
    from = startOfDay(new Date(now.getFullYear(), 0, 1));
  } else {
    from = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
  }

  const durationMs = to.getTime() - from.getTime();
  const prevTo = endOfDay(new Date(from.getTime() - 1));
  const prevFrom = startOfDay(new Date(prevTo.getTime() - durationMs));

  return { from, to, preset, prevFrom, prevTo };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !isOwnerRole(session.role)) {
    return apiError("Chỉ chủ cửa hàng xem báo cáo", 403);
  }

  const { from, to, preset, prevFrom, prevTo } = parseRange(req);
  const currentYear = new Date().getFullYear();
  const yearStart = new Date(currentYear, 0, 1);
  const now = new Date();
  const monthsToShow = now.getMonth() + 1;
  const monthLabels = [
    "T1", "T2", "T3", "T4", "T5", "T6",
    "T7", "T8", "T9", "T10", "T11", "T12",
  ];

  const [rangeOrders, prevOrders, yearOrders, allInRangeInclCancel, lowStock, categories] =
    await Promise.all([
      prisma.order.findMany({
        where: {
          createdAt: { gte: from, lte: to },
          status: { not: "cancelled" },
        },
        select: {
          id: true,
          total: true,
          subtotal: true,
          shippingFee: true,
          discount: true,
          createdAt: true,
          userId: true,
          customerName: true,
          paymentMethod: true,
          paymentStatus: true,
          fulfillmentType: true,
          status: true,
        },
      }),
      prisma.order.findMany({
        where: {
          createdAt: { gte: prevFrom, lte: prevTo },
          status: { not: "cancelled" },
        },
        select: { total: true },
      }),
      prisma.order.findMany({
        where: {
          createdAt: { gte: yearStart, lte: now },
          status: { not: "cancelled" },
        },
        select: { total: true, createdAt: true },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: from, lte: to } },
        select: { status: true, total: true },
      }),
      prisma.product.findMany({
        where: { status: "ACTIVE", stock: { lte: 10 } },
        select: { name: true, stock: true, sku: true },
        orderBy: { stock: "asc" },
        take: 12,
      }),
      prisma.category.findMany({
        select: { id: true, name: true, slug: true },
      }),
    ]);

  const revenue = rangeOrders.reduce((s, o) => s + o.total, 0);
  const orderCount = rangeOrders.length;
  const avgOrder = orderCount ? Math.round(revenue / orderCount) : 0;
  const prevRevenue = prevOrders.reduce((s, o) => s + o.total, 0);
  const prevOrderCount = prevOrders.length;

  const cancelledCount = allInRangeInclCancel.filter(
    (o) => o.status === "cancelled"
  ).length;
  const totalInclCancel = allInRangeInclCancel.length;
  const cancelRate = totalInclCancel
    ? Math.round((cancelledCount / totalInclCancel) * 1000) / 10
    : 0;

  const paidCount = rangeOrders.filter((o) => o.paymentStatus === "paid").length;
  const unpaidOrders = rangeOrders.filter((o) => o.paymentStatus !== "paid");
  const unpaidCount = unpaidOrders.length;
  const unpaidAmount = unpaidOrders.reduce((s, o) => s + o.total, 0);

  const pickupOrders = rangeOrders.filter((o) => o.fulfillmentType === "pickup");
  const deliveryOrders = rangeOrders.filter((o) => o.fulfillmentType !== "pickup");
  const pickupCount = pickupOrders.length;
  const deliveryCount = deliveryOrders.length;
  const pickupRevenue = pickupOrders.reduce((s, o) => s + o.total, 0);
  const deliveryRevenue = deliveryOrders.reduce((s, o) => s + o.total, 0);

  const discountTotal = rangeOrders.reduce((s, o) => s + o.discount, 0);
  const shippingTotal = rangeOrders.reduce((s, o) => s + o.shippingFee, 0);
  const subtotalTotal = rangeOrders.reduce((s, o) => s + o.subtotal, 0);

  // Doanh thu theo ngày
  const dayMap = new Map<string, number>();
  for (
    let t = startOfDay(from).getTime();
    t <= startOfDay(to).getTime();
    t += 86400000
  ) {
    const key = new Date(t).toISOString().slice(0, 10);
    dayMap.set(key, 0);
  }
  for (const o of rangeOrders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    dayMap.set(key, (dayMap.get(key) || 0) + o.total);
  }
  const dailyRevenue = [...dayMap.entries()].map(([label, value]) => ({
    label: label.slice(5),
    value,
  }));

  const monthlyRevenue = monthLabels.slice(0, monthsToShow).map((label, i) => {
    const value = yearOrders
      .filter((o) => o.createdAt.getMonth() === i)
      .reduce((s, o) => s + o.total, 0);
    return { label, value };
  });

  // Giờ cao điểm (0–23)
  const hourMap = Array.from({ length: 24 }, (_, h) => ({
    label: `${h}h`,
    value: 0,
  }));
  for (const o of rangeOrders) {
    hourMap[o.createdAt.getHours()].value += 1;
  }
  const peakHours = hourMap.filter((h) => h.value > 0);
  const busyHours = [...hourMap]
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)
    .filter((h) => h.value > 0);

  const statusLabels: Record<string, string> = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    shipping: "Đang giao",
    delivered: "Hoàn thành",
    cancelled: "Đã hủy",
  };
  const statusCount = new Map<string, number>();
  for (const o of allInRangeInclCancel) {
    statusCount.set(o.status, (statusCount.get(o.status) || 0) + 1);
  }
  const ordersByStatus = Object.keys(statusLabels).map((k) => ({
    label: statusLabels[k],
    value: statusCount.get(k) || 0,
  }));

  const payLabels: Record<string, string> = {
    cod: "COD / tiền mặt",
    transfer: "Chuyển khoản",
    vnpay: "VNPay",
  };
  const payMap = new Map<string, number>();
  for (const o of rangeOrders) {
    payMap.set(o.paymentMethod, (payMap.get(o.paymentMethod) || 0) + o.total);
  }
  const revenueByPayment = [...payMap.entries()]
    .map(([k, value]) => ({
      label: payLabels[k] || k,
      value,
    }))
    .sort((a, b) => b.value - a.value);

  const channelMix = [
    { label: "Giao tận nơi", value: deliveryRevenue },
    { label: "Nhận tại quầy", value: pickupRevenue },
  ].filter((c) => c.value > 0);

  const orderIds = rangeOrders.map((o) => o.id);
  const items =
    orderIds.length === 0
      ? []
      : await prisma.orderItem.findMany({
          where: { orderId: { in: orderIds } },
          select: {
            productName: true,
            quantity: true,
            price: true,
            product: { select: { categoryId: true } },
          },
        });

  const itemsSold = items.reduce((s, it) => s + it.quantity, 0);

  const productAgg = new Map<
    string,
    { qty: number; revenue: number; categoryId?: string }
  >();
  for (const it of items) {
    const prev = productAgg.get(it.productName) || {
      qty: 0,
      revenue: 0,
      categoryId: it.product?.categoryId,
    };
    prev.qty += it.quantity;
    prev.revenue += it.price * it.quantity;
    productAgg.set(it.productName, prev);
  }
  const topProducts = [...productAgg.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 10)
    .map(([name, v]) => ({
      label: name.length > 28 ? name.slice(0, 28) + "…" : name,
      value: v.qty,
      revenue: v.revenue,
    }));

  const catNameById = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const catAgg = new Map<string, number>();
  for (const [, v] of productAgg) {
    const name = (v.categoryId && catNameById[v.categoryId]) || "Khác";
    catAgg.set(name, (catAgg.get(name) || 0) + v.revenue);
  }
  const revenueByCategory = [...catAgg.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([label, value]) => ({ label, value }));

  const spendByUser = new Map<string, { label: string; value: number; orders: number }>();
  for (const o of rangeOrders) {
    if (!o.userId) continue;
    const prev = spendByUser.get(o.userId);
    if (prev) {
      prev.value += o.total;
      prev.orders += 1;
    } else {
      spendByUser.set(o.userId, {
        label: o.customerName,
        value: o.total,
        orders: 1,
      });
    }
  }
  const topCustomers = [...spendByUser.values()]
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
    .map(({ label, value, orders }) => ({ label, value, orders }));

  const lowStockItems = lowStock.map((p) => ({
    label: p.name.length > 28 ? p.name.slice(0, 28) + "…" : p.name,
    value: p.stock,
    sku: p.sku,
  }));

  return apiSuccess({
    range: {
      from: from.toISOString(),
      to: to.toISOString(),
      preset,
      prevFrom: prevFrom.toISOString(),
      prevTo: prevTo.toISOString(),
    },
    summary: {
      revenue,
      orderCount,
      avgOrder,
      itemsSold,
      cancelledCount,
      cancelRate,
      paidCount,
      unpaidCount,
      unpaidAmount,
      pickupCount,
      deliveryCount,
      pickupRevenue,
      deliveryRevenue,
      discountTotal,
      shippingTotal,
      subtotalTotal,
      prevRevenue,
      prevOrderCount,
      revenueChangePct: pctChange(revenue, prevRevenue),
      ordersChangePct: pctChange(orderCount, prevOrderCount),
    },
    monthlyRevenue,
    dailyRevenue,
    peakHours: busyHours,
    hourlyOrders: peakHours.length > 0 ? hourMap : [],
    topProducts,
    topCustomers,
    ordersByStatus,
    revenueByPayment,
    revenueByCategory,
    channelMix,
    lowStockItems,
  });
}
