import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth-server";
import { mapOrder, apiSuccess, apiError } from "@/lib/mappers";

const orderInclude = {
  items: { include: { product: true } },
  timeline: { orderBy: { createdAt: "asc" as const } },
};

const CANCELLABLE = new Set(["pending", "confirmed"]);

async function cancelOrder(
  id: string,
  existing: {
    status: string;
    items: { productId: string; quantity: number }[];
  },
  note: string | undefined,
  isAdmin: boolean
) {
  if (!CANCELLABLE.has(existing.status)) {
    return null;
  }

  return prisma.$transaction(async (tx) => {
    for (const item of existing.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
          soldCount: { decrement: item.quantity },
        },
      });
      // Không để soldCount âm
      await tx.product.updateMany({
        where: { id: item.productId, soldCount: { lt: 0 } },
        data: { soldCount: 0 },
      });
    }
    return tx.order.update({
      where: { id },
      data: {
        status: "cancelled",
        timeline: {
          create: {
            status: "cancelled",
            note: note || (isAdmin ? "Cửa hàng hủy đơn" : "Khách hủy đơn"),
          },
        },
      },
      include: orderInclude,
    });
  });
}

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
  if (!session) return apiError("Unauthorized", 401);

  const { id } = await params;
  const body = await req.json();
  const { status, note, paymentStatus, action } = body;

  const existing = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!existing) return apiError("Không tìm thấy đơn hàng", 404);

  const isAdmin = isAdminRole(session.role);
  const isOwner = existing.userId === session.userId;

  const wantsCancel =
    action === "cancel" || status === "cancelled";

  if (wantsCancel) {
    if (!isOwner && !isAdmin) return apiError("Forbidden", 403);
    const order = await cancelOrder(id, existing, note, isAdmin);
    if (!order) {
      return apiError("Đơn hàng không thể hủy ở trạng thái hiện tại");
    }
    return apiSuccess(mapOrder(order));
  }

  if (!isAdmin) return apiError("Forbidden", 403);

  // COD/CK: khi giao xong hoặc khách đã lấy → đánh dấu đã thu tiền (nếu chưa failed)
  let nextPayment = paymentStatus as string | undefined;
  if (
    status === "delivered" &&
    !nextPayment &&
    existing.paymentStatus === "pending" &&
    (existing.paymentMethod === "cod" || existing.paymentMethod === "transfer")
  ) {
    nextPayment = "paid";
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
              (status === "delivered" && existing.fulfillmentType === "pickup"
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
