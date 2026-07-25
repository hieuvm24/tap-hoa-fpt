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
    // month
    from = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
  }

  return { from, to, preset };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !isOwnerRole(session.role)) {
    return apiError("Chỉ chủ cửa hàng xem báo cáo", 403);
  }

  const { from, to, preset } = parseRange(req);
  const currentYear = new Date().getFullYear();
  const yearStart = new Date(currentYear, 0, 1);
  const now = new Date();
  const monthsToShow = now.getMonth() + 1;
  const monthLabels = [
    "T1",
    "T2",
    "T3",
    "T4",
    "T5",
    "T6",
    "T7",
    "T8",
    "T9",
    "T10",
    "T11",
    "T12",
  ];

  const [rangeOrders, yearOrders, allInRangeInclCancel, lowStock, categories] =
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
          createdAt: { gte: yearStart, lte: now },
          status: { not: "cancelled" },
        },
        select: { total: true, createdAt: true, userId: true, customerName: true },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: from, lte: to } },
        select: { status: true, total: true },
      }),
      prisma.product.findMany({
        where: { status: "ACTIVE", stock: { lte: 10 } },
        select: { name: true, stock: true, sku: true },
        orderBy: { stock: "asc" },
        take: 10,
      }),
      prisma.category.findMany({
        select: { id: true, name: true, slug: true },
      }),
    ]);

  const revenue = rangeOrders.reduce((s, o) => s + o.total, 0);
  const orderCount = rangeOrders.length;
  const avgOrder = orderCount ? Math.round(revenue / orderCount) : 0;
  const cancelledCount = allInRangeInclCancel.filter(
    (o) => o.status === "cancelled"
  ).length;
  const totalInclCancel = allInRangeInclCancel.length;
  const cancelRate = totalInclCancel
    ? Math.round((cancelledCount / totalInclCancel) * 1000) / 10
    : 0;

  const paidCount = rangeOrders.filter((o) => o.paymentStatus === "paid").length;
  const pickupCount = rangeOrders.filter(
    (o) => o.fulfillmentType === "pickup"
  ).length;
  const deliveryCount = orderCount - pickupCount;

  // Doanh thu theo ngay trong khoang
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
    label: label.slice(5), // MM-DD
    value,
  }));

  const monthlyRevenue = monthLabels.slice(0, monthsToShow).map((label, i) => {
    const value = yearOrders
      .filter((o) => o.createdAt.getMonth() === i)
      .reduce((s, o) => s + o.total, 0);
    return { label, value };
  });

  // Trang thai don (gom ca huy trong ky)
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

  // Phuong thuc thanh toan
  const payLabels: Record<string, string> = {
    cod: "COD",
    transfer: "Chuyển khoản",
    vnpay: "VNPay",
  };
  const payMap = new Map<string, number>();
  for (const o of rangeOrders) {
    payMap.set(o.paymentMethod, (payMap.get(o.paymentMethod) || 0) + o.total);
  }
  const revenueByPayment = [...payMap.entries()].map(([k, value]) => ({
    label: payLabels[k] || k,
    value,
  }));

  // Top SP theo so luong + doanh thu trong ky
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
    .sort((a, b) => b[1].qty - a[1].qty)
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

  const spendByUser = new Map<string, { label: string; value: number }>();
  for (const o of rangeOrders) {
    if (!o.userId) continue;
    const prev = spendByUser.get(o.userId);
    if (prev) prev.value += o.total;
    else spendByUser.set(o.userId, { label: o.customerName, value: o.total });
  }
  const topCustomers = [...spendByUser.values()]
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

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
    },
    summary: {
      revenue,
      orderCount,
      avgOrder,
      cancelledCount,
      cancelRate,
      paidCount,
      pickupCount,
      deliveryCount,
      discountTotal: rangeOrders.reduce((s, o) => s + o.discount, 0),
      shippingTotal: rangeOrders.reduce((s, o) => s + o.shippingFee, 0),
    },
    monthlyRevenue,
    dailyRevenue,
    topProducts,
    topCustomers,
    ordersByStatus,
    revenueByPayment,
    revenueByCategory,
    lowStockItems,
  });
}
