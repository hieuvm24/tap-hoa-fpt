import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth-server";
import { mapOrder, apiSuccess, apiError } from "@/lib/mappers";

const orderInclude = {
  items: { include: { product: true } },
  timeline: { orderBy: { createdAt: "asc" as const } },
};

const CANCELLABLE = new Set(["pending", "confirmed"]);

const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed"],
  confirmed: ["shipping", "delivered"], // delivered = nhan tai quay
  shipping: ["delivered"],
  delivered: [],
  cancelled: [],
};

const PAYMENT_STATUSES = new Set(["pending", "paid", "failed", "refunded"]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: orderInclude,
  });

  if (!order) return apiError("Không tìm thấy đơn hàng", 404);

  const isOwner = session?.userId === order.userId;
  const isAdmin = session && isAdminRole(session.role);
  if (!isOwner && !isAdmin) return apiError("Forbidden", 403);

  return apiSuccess(mapOrder(order));
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  const { id } = await params;
  const body = await req.json();
  const { status, note, paymentStatus, action } = body;
  const guestPhone = String(body.phone || "").replace(/\D/g, "");
  const guestCode = String(body.orderCode || "")
    .trim()
    .toUpperCase();

  const existing = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!existing) return apiError("Không tìm thấy đơn hàng", 404);

  const isAdmin = !!(session && isAdminRole(session.role));
  const isOwner = !!(session && existing.userId === session.userId);
  const guestMatch =
    guestPhone.length >= 9 &&
    existing.customerPhone.replace(/\D/g, "") === guestPhone &&
    (!guestCode || guestCode === existing.orderCode.toUpperCase());

  const wantsCancel = action === "cancel" || status === "cancelled";

  if (wantsCancel) {
    if (!isOwner && !isAdmin && !guestMatch) {
      return apiError(
        session
          ? "Forbidden"
          : "Cần mã đơn và SĐT khớp để hủy (khách vãng lai)",
        403
      );
    }
    if (!CANCELLABLE.has(existing.status)) {
      return apiError("Đơn hàng không thể hủy ở trạng thái hiện tại");
    }
    // Don da thanh toan online: chi admin xu ly (hoan tien)
    if (existing.paymentStatus === "paid" && !isAdmin) {
      return apiError(
        "Đơn đã thanh toán — liên hệ cửa hàng để hủy / hoàn tiền"
      );
    }

    const wasPaid = existing.paymentStatus === "paid";
    try {
      const order = await prisma.$transaction(async (tx) => {
        // Atomic: chi 1 request duoc huy
        const locked = await tx.order.updateMany({
          where: {
            id,
            status: { in: ["pending", "confirmed"] },
          },
          data: {
            status: "cancelled",
            ...(wasPaid && isAdmin ? { paymentStatus: "refunded" } : {}),
          },
        });
        if (locked.count === 0) {
          throw new Error("CANCEL_RACE");
        }

        for (const item of existing.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity },
              soldCount: { decrement: item.quantity },
            },
          });
          await tx.product.updateMany({
            where: { id: item.productId, soldCount: { lt: 0 } },
            data: { soldCount: 0 },
          });
        }

        return tx.order.update({
          where: { id },
          data: {
            timeline: {
              create: {
                status: "cancelled",
                note:
                  note ||
                  (isAdmin
                    ? wasPaid
                      ? "Cửa hàng hủy đơn — đã hoàn tiền (ghi nhận)"
                      : "Cửa hàng hủy đơn"
                    : guestMatch && !isOwner
                      ? "Khách hủy đơn (tra cứu mã + SĐT)"
                      : "Khách hủy đơn"),
              },
            },
          },
          include: orderInclude,
        });
      });
      return apiSuccess(mapOrder(order));
    } catch (e) {
      if (e instanceof Error && e.message === "CANCEL_RACE") {
        return apiError("Đơn hàng không thể hủy ở trạng thái hiện tại");
      }
      throw e;
    }
  }

  if (!session) return apiError("Unauthorized", 401);
  if (!isAdmin) return apiError("Forbidden", 403);

  if (status) {
    const allowed = STATUS_TRANSITIONS[existing.status] || [];
    if (!allowed.includes(status)) {
      return apiError(
        `Không thể chuyển trạng thái từ "${existing.status}" sang "${status}"`
      );
    }
    // Giao hang: khong nhay thang confirmed -> delivered
    if (
      status === "delivered" &&
      existing.status === "confirmed" &&
      (existing as { fulfillmentType?: string }).fulfillmentType !== "pickup"
    ) {
      return apiError("Đơn giao hàng cần chuyển sang đang giao trước");
    }
    // Nhan tai quay: khong dung shipping
    if (
      status === "shipping" &&
      (existing as { fulfillmentType?: string }).fulfillmentType === "pickup"
    ) {
      return apiError("Đơn nhận tại quầy không dùng trạng thái đang giao");
    }
  }

  let nextPayment = paymentStatus as string | undefined;
  if (nextPayment && !PAYMENT_STATUSES.has(nextPayment)) {
    return apiError("Trạng thái thanh toán không hợp lệ");
  }
  if (
    status === "delivered" &&
    !nextPayment &&
    existing.paymentStatus === "pending" &&
    (existing.paymentMethod === "cod" || existing.paymentMethod === "transfer")
  ) {
    nextPayment = "paid";
  }

  const fulfillmentType = (existing as { fulfillmentType?: string })
    .fulfillmentType;

  if (!status && !nextPayment) {
    return apiError("Cần truyền status hoặc paymentStatus");
  }

  // Chỉ xác nhận thu tiền / hoàn tiền — không đổi trạng thái đơn
  if (!status && nextPayment) {
    const order = await prisma.order.update({
      where: { id },
      data: {
        paymentStatus: nextPayment,
        timeline: {
          create: {
            status: existing.status,
            note:
              note ||
              (nextPayment === "paid"
                ? existing.paymentMethod === "transfer"
                  ? "Đã xác nhận chuyển khoản"
                  : "Đã thu tiền COD"
                : nextPayment === "refunded"
                  ? "Đã hoàn tiền cho khách"
                  : `Cập nhật thanh toán: ${nextPayment}`),
          },
        },
      },
      include: orderInclude,
    });
    return apiSuccess(mapOrder(order));
  }

  const order = await prisma.order.update({
    where: { id },
    data: {
      ...(status && { status: status as string }),
      ...(nextPayment && { paymentStatus: nextPayment }),
      ...(status && {
        timeline: {
          create: {
            status: status as string,
            note:
              note ||
              (status === "delivered" && fulfillmentType === "pickup"
                ? "Khách đã nhận tại quầy"
                : undefined),
          },
        },
      }),
    },
    include: orderInclude,
  });

  return apiSuccess(mapOrder(order));
}
