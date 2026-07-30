import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth-server";
import { apiSuccess, apiError } from "@/lib/mappers";

type NotifItem = {
  id: string;
  type: "order_pending" | "unpaid" | "low_stock" | "support";
  title: string;
  subtitle: string;
  href: string;
  createdAt: string;
};

/** Tổng hợp thông báo vận hành cho admin topbar */
export async function GET() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return apiError("Forbidden", 403);
  }

  const [pendingOrders, unpaidOrders, lowStock, unreadThreads] =
    await Promise.all([
      prisma.order.findMany({
        where: { status: "pending" },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          orderCode: true,
          customerName: true,
          total: true,
          createdAt: true,
        },
      }),
      prisma.order.findMany({
        where: {
          status: { not: "cancelled" },
          paymentStatus: { not: "paid" },
          paymentMethod: { in: ["cod", "transfer"] },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          orderCode: true,
          customerName: true,
          total: true,
          paymentMethod: true,
          createdAt: true,
        },
      }),
      prisma.product.findMany({
        where: { status: "ACTIVE", stock: { lte: 10 } },
        orderBy: { stock: "asc" },
        take: 5,
        select: { id: true, name: true, stock: true, sku: true },
      }),
      prisma.supportThread.findMany({
        where: { status: "open" },
        orderBy: { lastMessageAt: "desc" },
        take: 8,
        include: {
          user: { select: { name: true } },
          messages: {
            where: { senderRole: "customer", readAt: null },
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
      }),
    ]);

  const items: NotifItem[] = [];

  for (const o of pendingOrders) {
    items.push({
      id: `order-${o.id}`,
      type: "order_pending",
      title: `Đơn ${o.orderCode} chờ xác nhận`,
      subtitle: `${o.customerName} · ${o.total.toLocaleString("vi-VN")}đ`,
      href: "/admin/don-hang",
      createdAt: o.createdAt.toISOString(),
    });
  }

  for (const o of unpaidOrders) {
    items.push({
      id: `pay-${o.id}`,
      type: "unpaid",
      title: `Chưa thu tiền · ${o.orderCode}`,
      subtitle: `${o.customerName} · ${o.paymentMethod === "cod" ? "COD" : "CK"} · ${o.total.toLocaleString("vi-VN")}đ`,
      href: "/admin/don-hang",
      createdAt: o.createdAt.toISOString(),
    });
  }

  for (const p of lowStock) {
    items.push({
      id: `stock-${p.id}`,
      type: "low_stock",
      title: p.stock <= 0 ? `Hết hàng: ${p.name}` : `Sắp hết: ${p.name}`,
      subtitle: `${p.sku} · còn ${p.stock}`,
      href: "/admin/san-pham",
      createdAt: new Date().toISOString(),
    });
  }

  for (const t of unreadThreads) {
    if (t.messages.length === 0) continue;
    items.push({
      id: `support-${t.id}`,
      type: "support",
      title: `Tin nhắn từ ${t.user.name}`,
      subtitle: t.messages[0]?.content?.slice(0, 60) || "Tin mới",
      href: "/admin/tin-nhan",
      createdAt: t.lastMessageAt.toISOString(),
    });
  }

  items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const counts = {
    pendingOrders: pendingOrders.length,
    unpaid: unpaidOrders.length,
    lowStock: lowStock.length,
    supportUnread: unreadThreads.filter((t) => t.messages.length > 0).length,
  };

  return apiSuccess({
    counts,
    total:
      counts.pendingOrders +
      counts.unpaid +
      counts.lowStock +
      counts.supportUnread,
    items: items.slice(0, 20),
  });
}
