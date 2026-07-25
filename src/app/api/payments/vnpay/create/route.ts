import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth-server";
import { apiSuccess, apiError } from "@/lib/mappers";
import { createVnpayPaymentUrl } from "@/lib/vnpay";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return apiError("Vui long dang nhap de thanh toan", 401);

  const body = await req.json();
  const orderId = body.orderId as string | undefined;
  const orderCode = body.orderCode as string | undefined;

  if (!orderId && !orderCode) return apiError("Thieu orderId hoac orderCode");

  const order = await prisma.order.findFirst({
    where: orderId ? { id: orderId } : { orderCode },
  });
  if (!order) return apiError("Khong tim thay don hang", 404);

  if (order.paymentStatus === "paid") {
    return apiError("Don hang da thanh toan");
  }

  if (order.status === "cancelled") {
    return apiError("Don hang da huy");
  }

  const admin = isAdminRole(session.role);
  if (!order.userId) {
    return apiError("Don tai quay khong thanh toan qua VNPay khach", 403);
  }
  if (order.userId !== session.userId && !admin) {
    return apiError("Forbidden", 403);
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  try {
    const { paymentUrl, txnRef, demo } = createVnpayPaymentUrl({
      orderCode: order.orderCode,
      amount: order.total,
      orderInfo: `Thanh toan don hang ${order.orderCode}`,
      ipAddr: ip,
    });

    // Luu tat ca txnRef da tao — link cu van doi soat duoc khi khach thanh toan
    const prevRefs = (order.paymentTxnRef || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const paymentTxnRef = [...new Set([...prevRefs, txnRef])].join(",");

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentMethod: "vnpay",
        paymentTxnRef,
        paymentStatus: "pending",
      },
    });

    return apiSuccess({
      paymentUrl,
      txnRef,
      demo,
      orderCode: order.orderCode,
      amount: order.total,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Khong tao duoc link VNPay";
    return apiError(msg);
  }
}
