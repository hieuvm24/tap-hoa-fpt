import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth-server";
import { mapOrder, apiSuccess, apiError } from "@/lib/mappers";

const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed"],
  confirmed: ["shipping", "delivered"],
  shipping: ["delivered"],
  delivered: [],
  cancelled: [],
};

/**
 * Cập nhật trạng thái hàng loạt (xác nhận nhiều đơn buổi sáng).
 * Body: { ids: string[], status: string, note?: string }
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return apiError("Forbidden", 403);
  }

  const body = await req.json();
  const ids = Array.isArray(body.ids)
    ? body.ids.filter((x: unknown) => typeof x === "string")
    : [];
  const status = String(body.status || "");
  const note = typeof body.note === "string" ? body.note : undefined;

  if (ids.length === 0) return apiError("Danh sách đơn trống");
  if (ids.length > 50) return apiError("Tối đa 50 đơn mỗi lần");
  if (!["confirmed", "shipping", "delivered"].includes(status)) {
    return apiError("Trạng thái không hợp lệ cho cập nhật hàng loạt");
  }

  const orders = await prisma.order.findMany({
    where: { id: { in: ids } },
    include: { items: { include: { product: true } }, timeline: true },
  });

  const updated = [];
  const skipped: { id: string; orderCode?: string; reason: string }[] = [];

  for (const existing of orders) {
    const allowed = STATUS_TRANSITIONS[existing.status] || [];
    if (!allowed.includes(status)) {
      skipped.push({
        id: existing.id,
        orderCode: existing.orderCode,
        reason: `Không thể ${existing.status} → ${status}`,
      });
      continue;
    }
    if (
      status === "delivered" &&
      existing.status === "confirmed" &&
      existing.fulfillmentType !== "pickup"
    ) {
      skipped.push({
        id: existing.id,
        orderCode: existing.orderCode,
        reason: "Đơn giao hàng cần chuyển đang giao trước",
      });
      continue;
    }
    if (status === "shipping" && existing.fulfillmentType === "pickup") {
      skipped.push({
        id: existing.id,
        orderCode: existing.orderCode,
        reason: "Đơn tại quầy không dùng đang giao",
      });
      continue;
    }

    let paymentStatus: string | undefined;
    if (
      status === "delivered" &&
      existing.paymentStatus === "pending" &&
      (existing.paymentMethod === "cod" || existing.paymentMethod === "transfer")
    ) {
      paymentStatus = "paid";
    }

    const order = await prisma.order.update({
      where: { id: existing.id },
      data: {
        status,
        ...(paymentStatus && { paymentStatus }),
        timeline: {
          create: {
            status,
            note:
              note ||
              (status === "delivered" && existing.fulfillmentType === "pickup"
                ? "Khách đã nhận tại quầy"
                : "Cập nhật hàng loạt"),
          },
        },
      },
      include: {
        items: { include: { product: true } },
        timeline: { orderBy: { createdAt: "asc" } },
      },
    });
    updated.push(mapOrder(order));
  }

  for (const id of ids) {
    if (!orders.some((o) => o.id === id) && !skipped.some((s) => s.id === id)) {
      skipped.push({ id, reason: "Không tìm thấy đơn" });
    }
  }

  return apiSuccess({
    updated: updated.length,
    skipped: skipped.length,
    orders: updated,
    errors: skipped,
  });
}
