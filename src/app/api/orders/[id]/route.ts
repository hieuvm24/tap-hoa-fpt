import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth-server";
import { mapOrder, apiSuccess, apiError } from "@/lib/mappers";

const orderInclude = {
  items: { include: { product: true } },
  timeline: { orderBy: { createdAt: "asc" as const } },
};

const CANCELLABLE = new Set(["pending", "confirmed"]);

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

  // Customer cancel
  if (action === "cancel" || (status === "cancelled" && !isAdmin)) {
    if (!isOwner && !isAdmin) return apiError("Forbidden", 403);
    if (!CANCELLABLE.has(existing.status)) {
      return apiError("Đơn hàng không thể hủy ở trạng thái hiện tại");
    }

    const order = await prisma.$transaction(async (tx) => {
      for (const item of existing.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      return tx.order.update({
        where: { id },
        data: {
          status: "cancelled",
          timeline: {
            create: {
              status: "cancelled",
              note: note || (isAdmin ? "Admin hủy đơn" : "Khách hủy đơn"),
            },
          },
        },
        include: orderInclude,
      });
    });

    return apiSuccess(mapOrder(order));
  }

  if (!isAdmin) return apiError("Forbidden", 403);

  const order = await prisma.order.update({
    where: { id },
    data: {
      ...(status && { status: status as string }),
      ...(paymentStatus && { paymentStatus }),
      ...(status && {
        timeline: {
          create: {
            status: status as string,
            note: note || undefined,
          },
        },
      }),
    },
    include: orderInclude,
  });

  return apiSuccess(mapOrder(order));
}
